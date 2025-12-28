import { getWebPageBySlug } from '@/lib/actions/web-page.actions'
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import ReactMarkdown from 'react-markdown'

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>
}) {
  const params = await props.params
  const t = await getTranslations('Error')

  const { slug } = params

  const webPage = await getWebPageBySlug(slug)
  if (!webPage) {
    return { title: t('Not Found') }
  }
  return {
    title: webPage.title,
  }
}

export default async function ProductDetailsPage(props: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page: string; color: string; size: string }>
}) {
  const params = await props.params
  const { slug } = params
  const webPage = await getWebPageBySlug(slug)

  if (!webPage) notFound()

  return (
    <div className='p-4 max-w-3xl mx-auto'>
      <h1 className='h1-bold py-4'>{webPage.title}</h1>
      <section className='text-justify text-lg mb-20 web-page-content'>
        <ReactMarkdown>{webPage.content}</ReactMarkdown>
      </section>
    </div>
  )
}
