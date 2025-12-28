import {
    Body,
    Button,
    Container,
    Head,
    Heading,
    Hr,
    Html,
    Img,
    Preview,
    Section,
    Text
} from '@react-email/components'

interface BackInStockEmailProps {
  productName: string
  productSlug: string
  productImage?: string
  siteUrl: string
  siteName: string
  locale?: 'vi' | 'en-US'
}

const translations = {
  vi: {
    preview: 'Sản phẩm bạn quan tâm đã có hàng trở lại!',
    heading: 'Tin vui! Sản phẩm đã có hàng',
    greeting: 'Xin chào,',
    message: 'Sản phẩm bạn đăng ký nhận thông báo đã có hàng trở lại:',
    cta: 'Mua ngay',
    hurry: 'Nhanh tay đặt hàng trước khi hết!',
    footer: 'Bạn nhận được email này vì đã đăng ký nhận thông báo khi sản phẩm có hàng.',
    unsubscribe: 'Hủy đăng ký',
  },
  'en-US': {
    preview: 'The product you wanted is back in stock!',
    heading: 'Good news! Product is back in stock',
    greeting: 'Hello,',
    message: 'The product you subscribed to is now available:',
    cta: 'Shop Now',
    hurry: 'Hurry up and order before it sells out!',
    footer: 'You received this email because you subscribed to back-in-stock notifications.',
    unsubscribe: 'Unsubscribe',
  },
}

export default function BackInStockEmail({
  productName,
  productSlug,
  productImage,
  siteUrl,
  siteName,
  locale = 'vi',
}: BackInStockEmailProps) {
  const t = translations[locale] || translations['vi']
  const productUrl = `${siteUrl}/product/${productSlug}`

  return (
    <Html>
      <Head />
      <Preview>{t.preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>{t.heading}</Heading>
          
          <Text style={text}>{t.greeting}</Text>
          <Text style={text}>{t.message}</Text>

          <Section style={productSection}>
            {productImage && (
              <Img
                src={productImage}
                alt={productName}
                width={200}
                height={200}
                style={productImageStyle}
              />
            )}
            <Text style={productNameStyle}>{productName}</Text>
          </Section>

          <Section style={buttonSection}>
            <Button style={button} href={productUrl}>
              {t.cta}
            </Button>
          </Section>

          <Text style={hurryText}>{t.hurry}</Text>

          <Hr style={hr} />

          <Text style={footer}>
            {t.footer}
          </Text>
          <Text style={footer}>
            © {new Date().getFullYear()} {siteName}
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
}

const heading = {
  fontSize: '24px',
  letterSpacing: '-0.5px',
  lineHeight: '1.3',
  fontWeight: '700',
  color: '#484848',
  padding: '17px 0 0',
  textAlign: 'center' as const,
}

const text = {
  fontSize: '16px',
  lineHeight: '26px',
  color: '#484848',
  padding: '0 40px',
}

const productSection = {
  textAlign: 'center' as const,
  padding: '20px 40px',
}

const productImageStyle = {
  borderRadius: '8px',
  margin: '0 auto',
}

const productNameStyle = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#484848',
  marginTop: '16px',
}

const buttonSection = {
  textAlign: 'center' as const,
  padding: '20px 0',
}

const button = {
  backgroundColor: '#16a34a',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
}

const hurryText = {
  fontSize: '14px',
  color: '#ef4444',
  textAlign: 'center' as const,
  fontWeight: '500',
}

const hr = {
  borderColor: '#e6ebf1',
  margin: '20px 0',
}

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  textAlign: 'center' as const,
}
