import {
    Body,
    Container,
    Head,
    Heading,
    Html,
    Link,
    Preview,
    Section,
    Tailwind,
    Text,
} from '@react-email/components'

import { getSetting } from '@/lib/actions/setting.actions'
import { IContact } from '@/lib/db/models/contact.model'

// Email translations
const emailTranslations = {
  vi: {
    newContactMessage: 'Tin nhắn liên hệ mới',
    youHaveNewContact: 'Bạn có một tin nhắn liên hệ mới từ website',
    from: 'Từ',
    email: 'Email',
    phone: 'Điện thoại',
    subject: 'Tiêu đề',
    message: 'Nội dung',
    viewInAdmin: 'Xem trong Admin',
    notProvided: 'Không cung cấp',
  },
  'en-US': {
    newContactMessage: 'New Contact Message',
    youHaveNewContact: 'You have a new contact message from the website',
    from: 'From',
    email: 'Email',
    phone: 'Phone',
    subject: 'Subject',
    message: 'Message',
    viewInAdmin: 'View in Admin',
    notProvided: 'Not provided',
  },
}

type ContactNotificationProps = {
  contact: IContact
  locale?: 'vi' | 'en-US'
}

ContactNotificationEmail.PreviewProps = {
  contact: {
    _id: '123456789',
    name: 'Nguyễn Văn A',
    email: 'nguyenvana@example.com',
    phone: '0901234567',
    subject: 'Hỏi về sản phẩm',
    message: 'Tôi muốn hỏi về sản phẩm ABC, liệu có còn hàng không?',
    status: 'new',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as IContact,
  locale: 'vi',
} satisfies ContactNotificationProps

export default async function ContactNotificationEmail({
  contact,
  locale = 'vi',
}: ContactNotificationProps) {
  const { site } = await getSetting()
  const t = emailTranslations[locale] || emailTranslations['vi']

  return (
    <Html>
      <Preview>{t.newContactMessage}: {contact.subject}</Preview>
      <Tailwind>
        <Head />
        <Body className='font-sans bg-gray-100'>
          <Container className='max-w-xl mx-auto my-8 bg-white rounded-lg shadow-lg overflow-hidden'>
            {/* Header */}
            <Section className='bg-primary px-6 py-4'>
              <Heading className='text-white text-xl m-0'>
                {t.newContactMessage}
              </Heading>
            </Section>

            {/* Content */}
            <Section className='px-6 py-4'>
              <Text className='text-gray-600 mb-4'>
                {t.youHaveNewContact}
              </Text>

              {/* Contact Info */}
              <Section className='bg-gray-50 rounded-lg p-4 mb-4'>
                <div className='space-y-2'>
                  <Text className='m-0'>
                    <span className='font-semibold text-gray-700'>{t.from}:</span>{' '}
                    <span className='text-gray-900'>{contact.name}</span>
                  </Text>
                  <Text className='m-0'>
                    <span className='font-semibold text-gray-700'>{t.email}:</span>{' '}
                    <Link href={`mailto:${contact.email}`} className='text-blue-600'>
                      {contact.email}
                    </Link>
                  </Text>
                  <Text className='m-0'>
                    <span className='font-semibold text-gray-700'>{t.phone}:</span>{' '}
                    <span className='text-gray-900'>
                      {contact.phone || t.notProvided}
                    </span>
                  </Text>
                </div>
              </Section>

              {/* Subject */}
              <Section className='mb-4'>
                <Text className='font-semibold text-gray-700 mb-1'>{t.subject}:</Text>
                <Text className='text-gray-900 m-0 text-lg font-medium'>
                  {contact.subject}
                </Text>
              </Section>

              {/* Message */}
              <Section className='mb-4'>
                <Text className='font-semibold text-gray-700 mb-1'>{t.message}:</Text>
                <Section className='bg-gray-50 rounded-lg p-4'>
                  <Text className='text-gray-800 m-0 whitespace-pre-wrap'>
                    {contact.message}
                  </Text>
                </Section>
              </Section>

              {/* CTA Button */}
              <Section className='text-center mt-6'>
                <Link
                  href={`${site.url}/admin/contacts/${contact._id}`}
                  className='inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold no-underline'
                >
                  {t.viewInAdmin}
                </Link>
              </Section>
            </Section>

            {/* Footer */}
            <Section className='bg-gray-50 px-6 py-4 text-center'>
              <Text className='text-gray-500 text-sm m-0'>
                {site.name} - {site.url}
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}
