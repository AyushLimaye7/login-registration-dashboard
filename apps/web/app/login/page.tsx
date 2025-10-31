import { LoginForm } from '@/components/auth/login-form'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      
      {/* Login form */}
      <div className="relative z-10 p-8">
        <LoginForm />
      </div>
    </div>
  )
}