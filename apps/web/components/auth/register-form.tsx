"use client";

import { useState } from 'react'
import { Button } from "@workspace/ui/components/button"
import { useAuth } from '@/lib/auth-context'
import Link from 'next/link'

export function RegisterForm() {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: ''
  })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { register } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match!')
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }

    setIsLoading(true)

    try {
      await register(formData.email, formData.username, formData.password)
    } catch (err: any) {
      setError(err.message || 'Registration failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-sm">
      {error && (
        <div className="rounded-md bg-red-900/50 border border-red-700 p-3 text-sm text-red-200">
          {error}
        </div>
      )}
      
      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-medium text-gray-200">
          Email
        </label>
        <input
          type="email"
          id="email"
          className="w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          placeholder="you@example.com"
          required
          disabled={isLoading}
        />
      </div>
      
      <div className="space-y-2">
        <label htmlFor="reg-username" className="block text-sm font-medium text-gray-200">
          Username
        </label>
        <input
          type="text"
          id="reg-username"
          className="w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          value={formData.username}
          onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
          placeholder="johndoe"
          required
          disabled={isLoading}
        />
      </div>
      
      <div className="space-y-2">
        <label htmlFor="reg-password" className="block text-sm font-medium text-gray-200">
          Password
        </label>
        <input
          type="password"
          id="reg-password"
          className="w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          value={formData.password}
          onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
          placeholder="••••••••"
          required
          disabled={isLoading}
        />
      </div>
      
      <div className="space-y-2">
        <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-200">
          Confirm Password
        </label>
        <input
          type="password"
          id="confirm-password"
          className="w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          value={formData.confirmPassword}
          onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
          placeholder="••••••••"
          required
          disabled={isLoading}
        />
      </div>
      
      <Button 
        type="submit" 
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
        disabled={isLoading}
      >
        {isLoading ? 'Creating account...' : 'Register'}
      </Button>
      
      <p className="text-center text-sm text-gray-400">
        Already have an account?{' '}
        <Link href="/login" className="text-indigo-400 hover:text-indigo-300 hover:underline">
          Log in
        </Link>
      </p>
    </form>
  )
}