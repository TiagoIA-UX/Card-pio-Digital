import fs from 'node:fs'
import path from 'node:path'

const rootDir = process.cwd()
const sourcePath = path.join(rootDir, '.env.example')
const targetPath = path.join(rootDir, '.env.local')

if (!fs.existsSync(sourcePath)) {
  console.error('.env.example nao encontrado.')
  process.exit(1)
}

if (fs.existsSync(targetPath)) {
  console.log('.env.local ja existe. Nenhuma alteracao foi feita.')
  process.exit(0)
}

fs.copyFileSync(sourcePath, targetPath)
console.log('.env.local criado com base em .env.example.')
