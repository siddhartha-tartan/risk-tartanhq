import { redirect } from 'next/navigation';

export default function Home() {
  // Redirect directly to the upload page instead of the login page
  redirect('/upload');
  
  return null;
} 