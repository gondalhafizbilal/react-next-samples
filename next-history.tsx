import {FC, useCallback, useEffect, useState} from 'react';

import {GetServerSidePropsContext, GetServerSidePropsResult} from 'next';
import {useTranslation} from 'next-i18next';
import dynamic from 'next/dynamic';
import {useRouter} from 'next/router';

import {IAccountLayoutProps} from '@/components/templates/layout/types';
import {OrdersList} from '@/components/templates/ordersList';
import {LISTING_PAGINATION_LIMIT} from '@/configs/common';
import {ANALYTICS} from '@/constants/analytics';
import useAnalytics from '@/contexts/analytics.context';
import {useApp} from '@/hooks/useApp';
import {usePrevious} from '@/hooks/usePrevValue';
import {useSession} from '@/hooks/useSession';
import LoginSSRService from '@/services/auth/login.ssr.service';
import OrdersService from '@/services/orders/orders.service';
import {OrderListStatus, OrdersState} from '@/services/orders/types';
import {updateAWSConfig} from '@/utils/common/awsAmplify.util';
import {loadSSRTransalation} from '@/utils/common/loadSSRTransalation';
import {errorToast} from '@/utils/toast';

const AccountLayout = dynamic<IAccountLayoutProps>(
  () => import('@/components/templates/layout/containers/accountLayout.container').then((d) => d.AccountLayout),
  {
    ssr: true,
    loading: () => <b>Loading...</b>
  }
);

type OrderListPageProps = {
  data: OrdersState;
  errorMessage?: string;
};

const OrderHistory: FC<OrderListPageProps> = ({data, errorMessage}) => {
  const {setRecentOrderList} = useApp();
  const {user, status} = useSession();
  const {t, i18n} = useTranslation();
  const [loading, setLoading] = useState<boolean>(false);
  const [pageData, setPageData] = useState<OrdersState>({} as OrdersState);
  const [activeTab, setActiveTab] = useState<OrderListStatus>(OrderListStatus.ALL);
  const analytics = useAnalytics();
  const router = useRouter();
  const prevPath = usePrevious(router.pathname);
  const prevAsPath = usePrevious(router.asPath);

  const loadClientSideData = useCallback(async () => {
    if (status === 'loading' || prevAsPath === router.asPath) {
      return;
    }
    try {
      const lang = i18n.language;
      const view = router?.query?.view === OrderListStatus.ALL ? {} : {status: router?.query?.view};
      const limit = Number(router.query?.limit || LISTING_PAGINATION_LIMIT);
      const page = Number(router.query?.page || 1);
      setLoading(true);
      // Get orders from Graphql
      const orders = await OrdersService.getOrder({
        accessToken: user?.idToken || '',
        ...(view as any),
        page: page,
        locale: lang,
        limit: limit
      });
      setRecentOrderList(orders?.orders.slice(0, 5));
      setPageData(orders);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      errorToast(t<string>('message.somethingWentWrong', {ns: 'shared'}));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prevAsPath, router.asPath]);

  useEffect(() => {
    const activeTab = (router?.query?.view || OrderListStatus.ALL) as OrderListStatus;
    setActiveTab(activeTab);
  }, [router?.query]);

  useEffect(() => {
    if (prevPath !== router.pathname) {
      analytics.trackPageView(ANALYTICS.PAGE_VIEW, {url: router.pathname});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.pathname]);

  useEffect(() => {
    if (data) {
      setPageData(data);
    }
    //handle server error if there
    if (errorMessage) {
      errorToast(t<string>('message.somethingWentWrong', {ns: 'shared'}));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [errorMessage, data]);

  useEffect(() => {
    loadClientSideData();
  }, [loadClientSideData]);

  return (
    <AccountLayout>
      <OrdersList data={pageData} status={activeTab} isLoading={loading} />
    </AccountLayout>
  );
};

export async function getServerSideProps(
  context: GetServerSidePropsContext
): Promise<GetServerSidePropsResult<OrderListPageProps>> {
  const {locale, defaultLocale, query} = context;
  updateAWSConfig(context?.req as any);
  const user = await LoginSSRService.getSessionWithSSRContext(context);
  if (!user?.accessToken) {
    return {
      redirect: {
        destination: `/${context.locale || context.defaultLocale}/auth/login`,
        permanent: false
      }
    };
  }

  const lang = (locale || defaultLocale) as string;
  const view = String(query?.view || '');
  const limit = Number(query?.limit || LISTING_PAGINATION_LIMIT);
  const page = Number(query?.page || 1);

  try {
    const status = view === OrderListStatus.ALL ? {} : {status: view};

    // Get orders from Graphql
    const orders = await OrdersService.getOrder({
      accessToken: user?.idToken || '',
      ...(status as any),
      page,
      locale: lang,
      limit
    });
    return {
      props: {
        data: orders,
        ...(await loadSSRTransalation(locale, [
          'shared',
          'footer',
          'stock',
          'product',
          'history',
          'account'
        ]))
      }
    };
  } catch (error: any) {
    return {
      props: {
        data: {orders: [], pageInfo: {}, totalAmounts: []},
        errorMessage: error.message,
        ...(await loadSSRTransalation(locale, [
          'shared',
          'footer',
          'stock',
          'product',
          'history',
          'account'
        ]))
      }
    };
  }
}
export default OrderHistory;
