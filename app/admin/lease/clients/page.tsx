import { redirect } from 'next/navigation'

export default function LeaseClientsRedirect() {
  redirect('/admin/customers')
}
