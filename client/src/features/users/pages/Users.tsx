import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { getUsers, createUser } from '../api/adminApi'
import { type User, type Role } from '../types/User'
import Modal from '../../../shared/components/Modal'

export default function Users() {
  const { authFetch } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const loadUsers = async () => {
    setLoading(true)
    setError(null)
    try {
      const users = await getUsers(authFetch)
      setUsers(users)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className='w-full max-w-5xl mx-auto p-6'>
      <div className='flex items-center justify-between mb-4'>
        <div>
          <Link to='/' className='text-sm text-blue-600 hover:underline'>&larr; Back to dashboard</Link>
          <h1 className='text-2xl font-semibold text-gray-900 mt-1'>Users ({users.length})</h1>
        </div>
        <button
          type='button'
          onClick={() => setIsModalOpen(true)}
          className='rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-500'
        >
          Create user
        </button>
      </div>

      {error && (
        <div className='mb-4 rounded-md bg-red-50 border border-red-200 text-red-700 px-4 py-2 text-sm'>
          {error}
        </div>
      )}

      {loading
        ? <div className='py-10 text-center text-gray-500'>Loading....</div>
        : (
          <div className='overflow-x-auto rounded-lg border border-gray-200 shadow-sm'>
            <div className='grid grid-cols-[1fr_120px_180px] bg-gray-50'>
              <div className='px-4 py-3 text-sm font-semibold text-gray-700'>Email</div>
              <div className='px-4 py-3 text-sm font-semibold text-gray-700'>Role</div>
              <div className='px-4 py-3 text-sm font-semibold text-gray-700'>Created</div>
            </div>
            {users.length !== 0
              ? users.map((user) => (
                <div key={user.id} className='grid grid-cols-[1fr_120px_180px] border-t border-gray-200'>
                  <div className='px-4 py-3 text-sm text-gray-900'>{user.email}</div>
                  <div className='px-4 py-3 text-sm text-gray-700'>{user.role}</div>
                  <div className='px-4 py-3 text-sm text-gray-500'>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))
              : (
                <div className='px-4 py-10 text-center text-gray-500'>
                  No users found
                </div>
              )
            }
          </div>
        )
      }

      {isModalOpen && (
        <CreateUserModal
          onClose={() => setIsModalOpen(false)}
          onCreated={(user) => {
            setUsers((current) => [user, ...current])
            setIsModalOpen(false)
          }}
        />
      )}
    </div>
  )
}

function CreateUserModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: (user: User) => void
}) {
  const { authFetch } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role>('STAFF')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const user = await createUser(authFetch, { email, password, role })
      onCreated(user)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal title='Create user' onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className='mb-4'>
          <label htmlFor='new-user-email' className='mb-1.5 block text-sm font-medium text-gray-700'>
            Email
          </label>
          <input
            id='new-user-email'
            type='email'
            required
            autoComplete='off'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className='w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
          />
        </div>

        <div className='mb-4'>
          <label htmlFor='new-user-password' className='mb-1.5 block text-sm font-medium text-gray-700'>
            Password
          </label>
          <input
            id='new-user-password'
            type='password'
            required
            minLength={8}
            autoComplete='new-password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className='w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
          />
        </div>

        <div className='mb-4'>
          <label htmlFor='new-user-role' className='mb-1.5 block text-sm font-medium text-gray-700'>
            Role
          </label>
          <select
            id='new-user-role'
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            className='w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
          >
            <option value='STAFF'>Staff</option>
            <option value='PROVIDER'>Provider</option>
            <option value='ADMIN'>Admin</option>
          </select>
        </div>

        {error && (
          <div className='mb-4 rounded-md bg-red-50 border border-red-200 text-red-700 px-4 py-2 text-sm'>
            {error}
          </div>
        )}

        <div className='flex justify-end gap-2'>
          <button
            type='button'
            onClick={onClose}
            className='rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50'
          >
            Cancel
          </button>
          <button
            type='submit'
            disabled={isSubmitting}
            className='rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50'
          >
            {isSubmitting ? 'Creating…' : 'Create user'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
