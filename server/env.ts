import path from 'path'
import dotenv from 'dotenv'

// Must be imported before anything that reads process.env.
// Dev runs from /server (yarn start), production from the repo root.
dotenv.config({ path: path.resolve(process.cwd(), '.env'), quiet: true } as any)
dotenv.config({ path: path.resolve(process.cwd(), '..', '.env'), quiet: true } as any)
