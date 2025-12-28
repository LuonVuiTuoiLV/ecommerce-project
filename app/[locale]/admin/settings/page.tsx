import { getNoCachedSetting } from '@/lib/actions/setting.actions'
import { getTranslations } from 'next-intl/server'
import SettingForm from './setting-form'
import SettingNav from './setting-nav'

export async function generateMetadata() {
  const t = await getTranslations('Admin')
  return {
    title: t('Setting'),
  }
}
const SettingPage = async () => {
  return (
    <div className='grid md:grid-cols-5 max-w-6xl mx-auto gap-4'>
      <SettingNav />
      <main className='col-span-4 '>
        <div className='my-8'>
          <SettingForm setting={await getNoCachedSetting()} />
        </div>
      </main>
    </div>
  )
}

export default SettingPage
