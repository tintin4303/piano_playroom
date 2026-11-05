import { redirect } from 'next/navigation';

export default function RegisterPage() {
  // Public self-registration is disabled. All accounts are provisioned via Admin Studio.
  redirect('/login');
}
