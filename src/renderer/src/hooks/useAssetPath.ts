import { useEffect, useState } from 'react'

export function useAssetPath(filename: string): string {
  const [path, setPath] = useState('')

  useEffect(() => {
    window.api.resolveAssetPath(filename).then(setPath)
  }, [filename])

  return path
}
