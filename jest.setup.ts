import '@testing-library/jest-dom'

// Mock next-auth modules
jest.mock('next-auth')
jest.mock('@auth/prisma-adapter')
jest.mock('@auth/core')
