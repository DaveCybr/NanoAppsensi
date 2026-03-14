/**
 * POLA YANG BENAR untuk AbortController di React hooks.
 *
 * BUG di implementasi sebelumnya:
 *   abortRef.current?.abort()
 *   abortRef.current = new AbortController()
 *   ...
 *   if (abortRef.current.signal.aborted) return  // ← BUG: selalu cek controller TERBARU
 *
 * Masalahnya: abortRef.current sudah di-replace dengan controller baru.
 * Kalau render berikutnya memanggil abort() pada controller baru itu,
 * `abortRef.current.signal.aborted` jadi true — dan finally block
 * tidak pernah set isLoading = false. Hasilnya: infinite loading.
 *
 * SOLUSI: Simpan reference ke controller yang SPESIFIK untuk run ini
 * di local variable, bukan baca dari ref.
 *
 * Contoh penggunaan yang benar:
 *
 *   const load = useCallback(async (f: Filters) => {
 *     // 1. Batalkan run sebelumnya
 *     abortRef.current?.abort()
 *
 *     // 2. Buat controller baru dan simpan LOKAL
 *     const controller = new AbortController()
 *     abortRef.current = controller          // simpan ke ref untuk cleanup
 *     const { signal } = controller          // gunakan local reference untuk cek
 *
 *     setIsLoading(true)
 *     setError(null)
 *
 *     try {
 *       const result = await fetchData(f)
 *       if (signal.aborted) return           // ← cek signal LOKAL, bukan abortRef.current
 *       setData(result)
 *     } finally {
 *       if (!signal.aborted) {               // ← cek signal LOKAL
 *         setIsLoading(false)
 *       }
 *     }
 *   }, [...])
 *
 *   useEffect(() => {
 *     load(filters)
 *     return () => { abortRef.current?.abort() }
 *   }, [filters, load])
 */
export {} // module marker
