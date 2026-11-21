import type {BloodGroup, Component} from './types'

const groups: BloodGroup[] = ['O-','O+','A-','A+','B-','B+','AB-','AB+']
const plasma: Record<string,string[]> = {O:['O','A','B','AB'], A:['A','AB'], B:['B','AB'], AB:['AB']}
export function compatibleDonorGroups(recipient: BloodGroup, component: Component) {
  const allowed = plasma[recipient.slice(0,-1)]
  return new Set(component === 'PLASMA' ? groups.filter(g => allowed.includes(g.slice(0,-1))) : [recipient])
}
