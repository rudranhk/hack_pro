import asyncio
import os, time, json, tempfile, threading, subprocess
from pathlib import Path
from urllib.request import urlopen, Request
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from functools import partial
from websockets.sync.client import connect
import uvicorn
from test_integration import local_providers
from ws_router import channels
from main import app

class Static(SimpleHTTPRequestHandler):
    def do_GET(self):
        if not Path(self.translate_path(self.path)).is_file():
            self.path = "/index.html"
        super().do_GET()
    def handle(self):
        try:
            super().handle()
        except ConnectionResetError:
            pass  # Browser tabs close idle keep-alive connections during navigation.
    def log_message(self, *args): pass

def until(fn, label):
    end = time.monotonic() + 12
    while time.monotonic() < end:
        value = fn()
        if value: return value
        time.sleep(.12)
    raise AssertionError("Timed out: "+label)

class Tab:
    def __init__(self, port):
        target=json.load(urlopen(Request(f"http://127.0.0.1:{port}/json/new?about:blank",method="PUT")))
        self.ws=connect(target["webSocketDebuggerUrl"])
        self.counter = 0
        self.problems = []
        self.urls = {}
        self.call("Runtime.enable",{})
        self.call("Network.enable",{})
    def call(self, method, params):
        self.counter += 1
        self.ws.send(json.dumps(dict(id=self.counter,method=method,params=params)))
        while True:
            reply=json.loads(self.ws.recv(timeout=8))
            method = reply.get("method")
            params = reply.get("params",{})
            if method=="Runtime.exceptionThrown":
                self.problems.append(str(params["exceptionDetails"]))
            if method=="Runtime.consoleAPICalled" and params["type"] in ("warning","error"):
                self.problems.append(str(params["args"]))
            if method=="Network.requestWillBeSent":
                self.urls[params["requestId"]]=params["request"]["url"]
            if method=="Network.responseReceived" and params["response"]["status"]>=400:
                self.problems.append(str((params["response"]["status"],params["response"]["url"])))
            if method=="Network.loadingFailed" and not params.get("canceled"):
                url=self.urls.get(params["requestId"],"")
                intentional=params.get("blockedReason")=="inspector" and ("/api/workspace" in url or "/preferences?" in url)
                if not intentional:
                    self.problems.append(str((params["errorText"],url)))
            if reply.get("id")==self.counter: return reply["result"]
    def js(self, expression):
        result=self.call("Runtime.evaluate",dict(expression=expression,returnByValue=True))
        if "exceptionDetails" in result: raise AssertionError(result["exceptionDetails"].get("exception", {}).get("description", expression))
        return result['result'].get('value')
    def go(self, url):
        self.call("Page.navigate", dict(url=url))
        until(lambda:self.js("location.href") == url, url)
    def selector(self, selector):
        element = "document.querySelector("+json.dumps(selector)+")"
        until(lambda: self.js("Boolean("+element+")"),selector)
        self.js(element+".click()")
    def select(self, selector, value):
        self.js("(()=>{const e=document.querySelector("+json.dumps(selector)+");e.value="+json.dumps(value)+";e.dispatchEvent(new Event('change',{bubbles:true}));})()")
    def resize(self, width):
        self.call("Emulation.setDeviceMetricsOverride", dict(width=width,height=900,deviceScaleFactor=1,mobile=width<768))
    def check(self, condition):
        until(lambda:self.js(condition),condition)
    def contains(self,text):
        return self.js("document.body?.innerText.toLowerCase().includes("+json.dumps(text.lower())+")")
    def wait(self,text):
        try:
            until(lambda:self.contains(text),text)
        except AssertionError as exc:
            raise AssertionError(str(exc)+"; page: "+str(self.js("document.body.innerText")).encode("ascii","backslashreplace").decode()[-1800:]) from exc
    def fill(self,selector,value):
        self.js("(()=>{const e=document.querySelector("+json.dumps(selector)+");Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,"+json.dumps(value)+");e.dispatchEvent(new Event('input',{bubbles:true}));})()")
    def key(self,key):
        for kind in ("keyDown","keyUp"):
            self.call("Input.dispatchKeyEvent",dict(type=kind,key=key,code=key))
    def click(self,text):
        self.wait(text)
        needle=json.dumps(text.lower())
        buttons="Array.from(document.querySelectorAll('button')).filter(e=>!e.disabled && e.getClientRects().length)"
        expr="("+buttons+".find(e=>e.innerText.trim().toLowerCase()==="+needle+") || "+buttons+".find(e=>e.innerText.toLowerCase().includes("+needle+")))"
        until(lambda:self.js("Boolean("+expr+")"),text+" button")
        self.js("("+expr+").click()")


# Run from server/ on Windows. All service data, browser state and assets are temporary.
def run():
    site = "http://127.0.0.1:4173"
    api_base = "http://127.0.0.1:18087"
    with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as tmp, local_providers() as (_, provider_calls):
        os.environ["BLOOD_BUDDY_DATA"] = str(Path(tmp)/"db")
        os.environ["COLLECTION_STAFF_KEY"]="browser-test-key"
        assets = Path(tmp)/"dist"
        subprocess.run(["node", "node_modules/vite/bin/vite.js","build","--outDir",str(assets),"--logLevel","error"],
                       cwd=Path(__file__).resolve().parents[1], env=os.environ | {"VITE_API_BASE_URL":api_base},check=True)
        api = uvicorn.Server(uvicorn.Config(app, host="127.0.0.1",port=18087,log_level="error"))
        loop=asyncio.SelectorEventLoop()
        worker=threading.Thread(target=lambda:loop.run_until_complete(api.serve()),daemon=True)
        worker.start()
        until(lambda:api.started,"startup")
        http=ThreadingHTTPServer(("127.0.0.1",4173),partial(Static,directory=str(assets)))
        threading.Thread(target=http.serve_forever,daemon=True).start()
        profile=Path(tmp)/"profile"
        edge=subprocess.Popen([r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe","--headless=new",
            "--disable-gpu","--disable-extensions","--no-first-run","--disable-background-networking",
            "--remote-debugging-port=0","--user-data-dir="+str(profile),"about:blank"],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
        try:
            portfile=profile/"DevToolsActivePort"
            until(portfile.exists,"browser startup")
            port=int(portfile.read_text().splitlines()[0])
            h,d,overview=Tab(port),Tab(port),Tab(port)
            h.resize(1440)
            h.go(site+"/")
            h.selector('nav a[href="/hospital"]')
            h.wait("Start fresh demo")
            h.click("Start fresh demo")
            h.wait("How many units")
            h.check("!document.body.innerText.includes('Submit request')")
            h.selector("button[aria-label='Increase units']")
            h.selector("button[aria-label='Decrease units']")
            h.selector("button[aria-label='Increase units']")
            h.click("O-")
            h.click("Whole Blood")
            h.click("Next")
            h.click("Critical")
            h.click("Next"); h.wait("synthetic site")
            h.select("main select","15")
            h.click("Next"); h.wait("Confirm the details")
            h.wait("2 units")
            h.wait("15 km")
            h.select("select[aria-label='Logistics preference']", "Evening arrival")
            h.click("Back"); h.wait("synthetic site")
            h.check("document.querySelector('main select').value==='15'")
            h.click("Back"); h.wait("This priority")
            h.check("document.querySelector('main button[aria-pressed=true]').innerText.includes('Critical')")
            h.click("Back"); h.wait("How many units")
            h.check("['O-','Whole Blood'].every(label=>Array.from(document.querySelectorAll('main button[aria-pressed=true]')).some(b=>b.innerText.includes(label)))")
            h.click("Next"); h.wait("This priority")
            h.click("Next"); h.wait("synthetic site")
            h.select("main select","5")
            h.click("Next"); h.wait("2 units")
            h.check("document.querySelector('select[aria-label=\"Logistics preference\"]').value==='Evening arrival'")
            from database import database
            wizard_room = h.js("sessionStorage.getItem('blood-buddy-room')")
            with database(wizard_room) as db:
                assert db.execute("SELECT count(*) FROM request").fetchone()[0] == 0
            h.click("Submit request")
            h.wait("0 of 2 units committed")
            with database(wizard_room) as db:
                assert [tuple(row) for row in db.execute("SELECT bloodGroup,component,unitsNeeded,urgency,radius FROM request")] == [("O-","WHOLE",2,"CRITICAL",5)]
            print("PASS fresh demo starts at Blood Requirement; all four steps, retained draft and review-only creation",flush=True)
            h.click("Mark reviewed as demo coordinator"); h.wait("Reviewed in demo coordinator role")
            h.wait("Match explanations")
            h.js("Array.from(document.querySelectorAll('summary')).find(e=>e.innerText.includes('donors considered')).click()")
            h.wait("Outside search radius")
            h.wait("Gemini + Qdrant")
            h.selector("main details summary")
            h.wait("Why this donor?")
            h.js("Array.from(document.querySelectorAll('summary')).find(e=>e.innerText.includes('Distances')).click()")
            room=h.js("sessionStorage.getItem('blood-buddy-room')")
            rid=h.js("location.pathname.split('/').pop()")
            overview.go(site+"/hospital?room="+room)
            overview.wait("0 / 2")
            inbox=h.js("Array.from(document.links).find(a=>a.innerText.includes('Open donor inbox')).href")
            d.go(inbox)
            d.resize(390)
            # Document sentinels detect a full-page reload. Assertions finish before the 30s polling fallback.
            h.js("window.qaDocument=true"); overview.js("window.qaDocument=true")
            d.click("Accept invitation")
            h.wait("1 of 2 units committed"); overview.wait("1 / 2")
            assert h.js("window.qaDocument") and overview.js("window.qaDocument")
            assert any("2 unit(s) of O- WHOLE" in txt for txt in provider_calls)
            h.click("Send check-in reminder"); d.wait("Please check in at reception")
            d.click("Share 15 min ETA"); h.wait("ETA 15 min")
            d.click("Stop sharing ETA"); h.check("!document.body.innerText.includes('ETA 15 min')")
            d.selector("article details summary")
            d.click("on my way"); d.click("arrived")
            h.wait("Collection staff key")
            h.fill("input[type=password]","browser-test-key")
            h.click("Record synthetic collection"); h.click("Confirm action"); d.wait("donated")
            d.select("select", "2"); d.click("Decline"); h.wait("declined")
            h.click("Match again")
            d.select("select", "3"); d.click("Accept invitation"); h.wait("2 of 2 units committed")
            d.click("Withdraw commitment"); d.click("Confirm action"); h.wait("1 of 2 units committed")
            h.click("Expand to 15"); h.wait("15 km radius")
            h.click("Expand to 40"); h.wait("40 km radius")
            async def drop():
                for peer in tuple(channels[(room,rid)]):
                    await peer.close(code=1001)
            asyncio.run_coroutine_threadsafe(drop(),loop).result(5)
            h.wait("Reconnecting"); h.wait("Live · request channel")
            h.click("Cancel request"); h.click("Keep open")
            h.click("Cancel request"); h.click("Confirm cancellation"); h.wait("cancelled")
            d.select("select","8"); d.click("Pause invitations"); d.click("Resume invitations")
            d.selector("a[href*='/donor/privacy']"); d.wait("Privacy & workspace data")
            d.selector("a[href^='/donor?']"); d.wait("Donor inbox")
            print("PASS two-unit flow, independent dashboard, donor lifecycle, ETA, reminders, scope and reconnect",flush=True)

            def route(tab, path, title):
                tab.go(site+path)
                tab.wait(title)
            route(h,"/hospital/profile","Invitation preferences")
            h.click("Switch to manual"); h.wait("Enable automatic invitations")
            downloads=Path(tmp)/"downloads"
            downloads.mkdir()
            h.call("Browser.setDownloadBehavior",dict(behavior="allow",downloadPath=str(downloads)))
            h.click("Export JSON")
            exported=downloads/"blood-buddy-synthetic-workspace.json"
            until(exported.exists,"download")
            assert json.loads(exported.read_text(encoding="utf8"))["requests"][0]["id"] == rid
            h.selector("a[href='/hospital/privacy']:not(nav a)"); h.wait("Privacy & workspace data")
            route(h,"/hospital/stock","Synthetic opening stock")
            h.wait("0 of 7 days confirmed")
            h.click("Record stock issue"); h.click("Confirm action")
            h.wait("1 units issued today")
            h.selector("section details summary")
            dates=h.js("Array.from(document.querySelector('section details select').options,o=>o.value)")
            for day in dates:
                h.select("section details select",day)
                h.js("(()=>{const e=document.querySelector('section details input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,'1');e.dispatchEvent(new Event('input',{bubbles:true}));})()")
                h.click("Save daily total")
                h.wait("Daily total saved for "+day)
            h.wait("Estimated use over the next 7 days: 7 units")
            h.wait("Projected shortfall: 5 units")
            h.js("Array.from(document.querySelectorAll('summary')).find(e=>e.innerText.includes('Receive stock')).click()")
            h.fill("details:has(option[value=RECEIVE]) input","3")
            h.click("Save inventory change"); h.wait("5 units on hand")
            h.js("document.querySelector('details:has(option[value=RECEIVE])').open=true")
            h.select("details select:has(option[value=RECEIVE])","COUNT")
            h.fill("details:has(option[value=RECEIVE]) input","2")
            h.click("Save inventory change");h.click("Go back");h.wait("5 units on hand")
            h.click("Save inventory change");h.click("Confirm action");h.wait("2 units on hand")
            h.js("document.querySelector('[role=tab]').focus()");h.key("ArrowRight")
            h.check("document.querySelector('[role=tab][aria-selected=true]').innerText==='Platelets'")
            print("PASS inventory issue, seven confirmed daily totals and stock shortfall",flush=True)
            for tab in ["Whole Blood","Platelets","Plasma"]:
                h.click(tab)
                h.check("document.querySelector('[aria-selected=true]').innerText === "+json.dumps(tab))
            h.selector("main a[href*='requests/new']"); h.wait("Blood Requirement"); h.click("Next")
            h.click("Urgent"); h.click("Next"); h.select("main select","15"); h.click("Next"); h.wait("15 km"); h.click("Submit request")
            h.wait("Send invitation"); h.click("Send invitation"); h.wait("Open donor inbox")
            h.click("Close request"); h.click("Confirm close"); h.wait("Closed")
            h.click("Reopen request");h.wait("Searching")
            h.click("Close request");h.click("Confirm close");h.wait("Reopen request")
            route(h,"/hospital/profile","Enable automatic invitations")
            h.click("Enable automatic invitations"); h.wait("Switch to manual")
            route(h,"/hospital/donors","synthetic records")
            for label,value in [("Blood group","O-"),("Component","WHOLE"),("Availability","Available"),("Radius","5"),("Historical response rate",".6")]:
                h.select("select[aria-label='"+label+"']",value)
            h.js("(()=>{const e=document.querySelector('main input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,'999');e.dispatchEvent(new Event('input',{bubbles:true}));})()")
            h.wait("No donors match")
            route(h,"/hospital/requests","Every request")
            h.selector("main a[href='/hospital/requests/new']"); h.wait("How many units")
            h.check("Array.from(document.querySelectorAll('button')).find(e=>e.innerText==='Next').disabled")
            h.click("O-"); h.click("Whole Blood"); h.click("Next"); h.wait("This priority")
            h.call("Network.enable",{})
            h.call("Network.setBlockedURLs",{"urls":["*/api/workspace*"]})
            from ws_router import publish
            asyncio.run_coroutine_threadsafe(publish(room,"qa.refresh"),loop).result(5)
            h.wait("Retry connection")
            h.call("Network.setBlockedURLs",{"urls":[]})
            h.click("Retry connection"); h.wait("This priority")
            h.check("!document.body.innerText.includes('Retry connection')")
            h.click("Back"); h.click("Cancel"); h.wait("Every request")
            d.call("Network.enable",{})
            d.call("Network.setBlockedURLs",{"urls":["*/api/workspace*"]})
            route(d,"/donor","Retry connection")
            d.call("Network.setBlockedURLs",{"urls":[]})
            d.click("Retry connection"); d.wait("Donor inbox")
            route(d,"/donor?donor=999","Unknown demo donor")
            d.selector("a[href='/donor']"); d.wait("Donor inbox")
            print("PASS manual invitation preference, actual JSON download, network filters, stock prefill, wizard guards, closure and invalid donor recovery",flush=True)

            route(h,"/hospital","Active Requests")
            for href in ("/hospital/requests?status=OPEN","/hospital/matches?view=responding","/hospital/matches?view=secured","/hospital/matches?view=pending","/hospital/stock"):
                h.selector("main a[href='"+href+"']")
                h.check("location.pathname+location.search==="+json.dumps(href))
                h.js("history.back()");h.wait("Active Emergency Requests")
            route(h,"/hospital/requests","Search requests")
            h.fill("main input",rid);h.select("main select:has(option[value=CANCELLED])","CANCELLED")
            h.select("main select:has(option[value=URGENT])","CRITICAL");h.select("main select:has(option[value='O-'])","O-")
            h.check("document.querySelectorAll('main a[href^=\"/hospital/requests/REQ-\"]').length===1")
            h.fill("main input","missing");h.wait("No requests match these filters")
            h.click("Clear request filters");h.wait(rid)
            # Age one persisted QA request to distinguish period filtering from a cosmetic selector.
            from database import database
            with database(room,write=True) as db:
                db.execute("UPDATE request SET created=created-3*86400 WHERE id=?", (rid,))
            route(h,"/hospital/analytics?days=7","Reporting period")
            h.check("document.querySelector('svg[role=img]').getAttribute('aria-label').includes('CRITICAL 1')")
            h.select("main select","1");h.check("location.search==='?days=1'")
            h.check("document.querySelector('svg[role=img]').getAttribute('aria-label').includes('CRITICAL 0')")
            h.select("main select","all")
            h.check("location.search==='?days=all'")
            route(d,"/donor?donor=8","Edit donor travel preference")
            d.js("Array.from(document.querySelectorAll('summary')).find(e=>e.innerText.includes('travel preference')).click()")
            d.fill("input[type=number]","101");d.wait("Enter a whole number")
            d.fill("input[type=number]","10")
            d.call("Network.setBlockedURLs",{"urls":["*/api/donors/*/preferences*"]})
            d.click("Save travel preference");d.wait("Action could not be completed")
            d.selector("button[aria-label='Dismiss notification']")
            d.call("Network.setBlockedURLs",{"urls":[]})
            d.call("Network.emulateNetworkConditions",dict(offline=False,latency=350,downloadThroughput=-1,uploadThroughput=-1))
            d.js("(()=>{const b=Array.from(document.querySelectorAll('button')).find(b=>b.innerText==='Save travel preference');b.click();b.click()})()")
            d.check("!!document.querySelector('button[aria-busy=true]:disabled')")
            d.wait("Travel preference saved")
            d.call("Network.emulateNetworkConditions",dict(offline=False,latency=0,downloadThroughput=-1,uploadThroughput=-1))
            d.go(site+"/donor?donor=8");d.wait("Donor inbox")
            d.check("document.querySelector('input[type=number]').value==='10'")
            print("PASS dashboard drill-downs, request filters, reopen, inventory correction, travel preference persistence",flush=True)

            pages=[("/","Hospital demo"),("/hospital","Units Secured"),("/hospital/requests","Every request"),
                ("/hospital/requests/new","Blood Requirement"),("/hospital/requests/"+rid,"Request activity"),
                ("/hospital/requests/missing","Request not found"),("/hospital/donors","synthetic records"),
                ("/hospital/matches","Donor commitments"),("/hospital/stock","Synthetic opening stock"),
                ("/hospital/analytics","Median response time"),("/hospital/profile","Invitation preferences"),
                ("/hospital/privacy","Privacy & workspace data"),("/donor","Donor inbox"),("/donor/alert","Donor inbox"),
                ("/donor/status","Donor inbox"),("/donor/screening","Donor inbox"),("/donor/privacy","Privacy & workspace data"),
                ("/missing","Page not found")]
            overflows=[]
            for width in [360,768,1024,1280,1440]:
                h.resize(width)
                for path,title in pages:
                    route(h,path,title)
                    actual=h.js("document.documentElement.scrollWidth")
                    if actual > width+1: overflows.append((width,path,actual))
            print("LAYOUT",overflows,flush=True)
            assert not overflows,"responsive overflow: "+str(overflows)
            h.resize(360)
            route(h,"/hospital","Units Secured")
            h.selector("button[aria-label='Open navigation']")
            h.key("Escape")
            h.check("document.querySelector('[aria-label=\"Open navigation\"]').getAttribute('aria-expanded')==='false'")
            h.selector("button[aria-label='Open navigation']")
            h.selector("button[aria-label='Close menu']")
            h.selector("button[aria-label='Open navigation']")
            h.selector("aside a[href='/hospital/analytics']"); h.wait("Acceptances")
            h.selector("summary[aria-label='Recent workspace events']")
            h.wait("Workspace activity")
            h.selector("button[aria-label='Open navigation']")
            h.selector("a[aria-label='Blood Buddy home']"); h.wait("Hospital demo")
            route(h,"/hospital","Start fresh demo")
            h.call("Page.reload",{}); h.wait("Start fresh demo")
            h.click("Start fresh demo"); h.wait("How many units")
            assert h.js("sessionStorage.getItem('blood-buddy-room')") != wizard_room
            h.click("Next"); h.wait("This priority")
            h.call("Page.reload",{}); h.wait("How many units")
            h.check("!document.body.innerText.includes('Submit request')")
            h.click("Next"); h.wait("This priority")
            h.click("Next"); h.wait("synthetic site")
            h.click("Next"); h.wait("Confirm the details")
            h.click("Submit request")
            h.wait("Open donor inbox")
            fresh=h.js("sessionStorage.getItem('blood-buddy-room')")
            req=h.js("location.pathname.split('/').pop()")
            h.js("window.waveDemo=true")
            d.go(h.js("Array.from(document.links).find(a=>a.innerText.includes('Open donor inbox')).href"))
            d.wait("Decline")
            d.select("select[aria-label='Invitation action language']", "hi")
            d.click("मना करें"); h.wait("declined")
            from database import database
            with database(fresh,write=True) as db:
                db.execute("UPDATE dispatch SET due=0 WHERE requestId=?", (req,))
            h.wait("Wave 2")
            d.select("select", "2"); d.click("निमंत्रण स्वीकार करें")
            h.wait("1 of 1 units committed")
            assert h.js("window.waveDemo")
            d.wait("1 accepted")
            print("PASS automated second wave, Hindi decline/accept, durable notification counters and live coverage",flush=True)
            print("PASS 18 route/state cases at 5 widths; mobile navigation, activity and home links",flush=True)
            d.js("Array.from(document.querySelectorAll('summary')).find(e=>e.innerText.includes('Invitation history')).click()")
            d.wait("accepted")
            route(h,"/does-not-exist","Page not found")
            h.selector("a[href='/']"); h.wait("Hospital demo")
            for target,title in [("/hospital","Units Secured"),("/donor","Donor inbox")]:
                for selector in ("nav","main"):
                    h.selector(selector+" a[href='"+target+"']"); h.wait(title)
                    h.js("history.back()");h.wait("Hospital demo")
            h.call("Network.emulateNetworkConditions",dict(offline=False,latency=500,downloadThroughput=-1,uploadThroughput=-1))
            h.selector("nav a[href='/hospital']")
            # A fresh document clears the in-memory snapshot.
            h.call("Page.reload",{})
            h.wait("Loading hospital and donor records")
            h.wait("Active Emergency Requests")
            h.call("Network.emulateNetworkConditions",dict(offline=False,latency=0,downloadThroughput=-1,uploadThroughput=-1))
            problems=[issue for tab in (h,d,overview) for issue in tab.problems]
            assert not problems, str(problems)[:3000]
            print("PASS no unexpected HTTP or network failures, console warnings/errors or uncaught JS exceptions",flush=True)
            for tab in (h,d,overview): tab.ws.close()
        finally:
            edge.terminate(); edge.wait(timeout=10)
            api.should_exit=True
            worker.join(timeout=5)
            http.shutdown()
            http.server_close()


if __name__ == "__main__":
    run()
