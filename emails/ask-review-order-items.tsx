import {
    Body,
    Button,
    Column,
    Container,
    Head,
    Heading,
    Html,
    Img,
    Link,
    Preview,
    Row,
    Section,
    Tailwind,
    Text,
} from '@react-email/components'

import { getSetting } from '@/lib/actions/setting.actions'
import { IOrder } from '@/lib/db/models/order.model'
import { formatCurrency } from '@/lib/utils'

// Email translations (emails don't support next-intl)
const emailTranslations = {
  vi: {
    reviewOrderItems: 'Đánh giá sản phẩm đã mua',
    orderId: 'Mã đơn hàng',
    purchasedOn: 'Ngày mua',
    pricePaid: 'Số tiền',
    reviewThisProduct: 'Đánh giá sản phẩm',
    items: 'Sản phẩm',
    tax: 'Thuế',
    shipping: 'Vận chuyển',
    total: 'Tổng cộng',
  },
  'en-US': {
    reviewOrderItems: 'Review Order Items',
    orderId: 'Order ID',
    purchasedOn: 'Purchased On',
    pricePaid: 'Price Paid',
    reviewThisProduct: 'Review this product',
    items: 'Items',
    tax: 'Tax',
    shipping: 'Shipping',
    total: 'Total',
  },
}

type OrderInformationProps = {
  order: IOrder
  locale?: 'vi' | 'en-US'
}

AskReviewOrderItemsEmail.PreviewProps = {
  order: {
    _id: '123',
    isPaid: true,
    paidAt: new Date(),
    totalPrice: 100,
    itemsPrice: 100,
    taxPrice: 0,
    shippingPrice: 0,
    user: {
      name: 'John Doe',
      email: 'john.doe@example.com',
    },
    shippingAddress: {
      fullName: 'John Doe',
      street: '123 Main St',
      city: 'New York',
      postalCode: '12345',
      country: 'USA',
      phone: '123-456-7890',
      province: 'New York',
    },
    items: [
      {
        clientId: '123',
        name: 'Product 1',
        image: 'https://via.placeholder.com/150',
        price: 100,
        quantity: 1,
        product: '123',
        slug: 'product-1',
        category: 'Category 1',
        countInStock: 10,
      },
    ],
    paymentMethod: 'PayPal',
    expectedDeliveryDate: new Date(),
    isDelivered: true,
  } as IOrder,
  locale: 'vi',
} satisfies OrderInformationProps

export default async function AskReviewOrderItemsEmail({
  order,
  locale = 'vi',
}: OrderInformationProps) {
  const { site } = await getSetting()
  const t = emailTranslations[locale] || emailTranslations['vi']
  const dateFormatter = new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en', { dateStyle: 'medium' })
  
  return (
    <Html>
      <Preview>{t.reviewOrderItems}</Preview>
      <Tailwind>
        <Head />
        <Body className='font-sans bg-white'>
          <Container className='max-w-xl'>
            <Heading>{t.reviewOrderItems}</Heading>
            <Section>
              <Row>
                <Column>
                  <Text className='mb-0 text-gray-500 whitespace-nowrap text-nowrap mr-4'>
                    {t.orderId}
                  </Text>
                  <Text className='mt-0 mr-4'>{order._id.toString()}</Text>
                </Column>
                <Column>
                  <Text className='mb-0 text-gray-500 whitespace-nowrap text-nowrap mr-4'>
                    {t.purchasedOn}
                  </Text>
                  <Text className='mt-0 mr-4'>
                    {dateFormatter.format(order.createdAt)}
                  </Text>
                </Column>
                <Column>
                  <Text className='mb-0 text-gray-500 whitespace-nowrap text-nowrap mr-4'>
                    {t.pricePaid}
                  </Text>
                  <Text className='mt-0 mr-4'>
                    {formatCurrency(order.totalPrice)}
                  </Text>
                </Column>
              </Row>
            </Section>
            <Section className='border border-solid border-gray-500 rounded-lg p-4 md:p-6 my-4'>
              {order.items.map((item) => (
                <Row key={item.product} className='mt-8'>
                  <Column className='w-20'>
                    <Link href={`${site.url}/product/${item.slug}`}>
                      <Img
                        width='80'
                        alt={item.name}
                        className='rounded'
                        src={
                          item.image.startsWith('/')
                            ? `${site.url}${item.image}`
                            : item.image
                        }
                      />
                    </Link>
                  </Column>
                  <Column className='align-top'>
                    <Link href={`${site.url}/product/${item.slug}`}>
                      <Text className='mx-2 my-0'>
                        {item.name} x {item.quantity}
                      </Text>
                    </Link>
                  </Column>
                  <Column align='right' className='align-top '>
                    <Button
                      href={`${site.url}/product/${item.slug}#reviews`}
                      className='text-center bg-blue-500 hover:bg-blue-700 text-white   py-2 px-4 rounded'
                    >
                      {t.reviewThisProduct}
                    </Button>
                  </Column>
                </Row>
              ))}
              {[
                { name: t.items, price: order.itemsPrice },
                { name: t.tax, price: order.taxPrice },
                { name: t.shipping, price: order.shippingPrice },
                { name: t.total, price: order.totalPrice },
              ].map(({ name, price }) => (
                <Row key={name} className='py-1'>
                  <Column align='right'>{name}:</Column>
                  <Column align='right' width={70} className='align-top'>
                    <Text className='m-0'>{formatCurrency(price)}</Text>
                  </Column>
                </Row>
              ))}
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}
