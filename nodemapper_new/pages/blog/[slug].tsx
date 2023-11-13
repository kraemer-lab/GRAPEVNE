import { useRouter } from 'next/router'

// if we navigate to localhost:3000/blog/123...
export default function BlogPost() {
  const router = useRouter()
  const { slug } = router.query

  return <p>Post: {slug}</p> // ...you'll see "Post: 123"
}
