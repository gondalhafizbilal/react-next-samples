import React from 'react';

import {CategoriesModel} from '@sdk/types/model/categories.model';
import {FlexiPageStructureModel} from '@sdk/types/model/flexi.model';
import {Box} from '@mui/material';
import {GetServerSidePropsContext, GetServerSidePropsResult, NextPage} from 'next';
import {useTranslation} from 'next-i18next';
import dynamic from 'next/dynamic';

import {Seo} from '@/components/molecules/seo';
import {ErrorBoundary} from '@/components/templates/errorBoundary';
import {config} from '@/configs/env';
import {ACTIVATE_NEW_STOCK_SYSTEM} from '@/configs/firebase/remoteConfigKey';
import {useFeatureFlags} from '@/contexts/FeatureFlags.context';
import {useFlexiPageClientData} from '@/hooks/useFlexiPageClient';
import {CmsService} from '@/services/cms';
import MultiGetService from '@/services/multistore/multiget.service';
import {getCategoryIdFromSlug} from '@/utils/category/category.util';
import {loadSSRTransalation} from '@/utils/common/loadSSRTransalation';
import {getStoreCodesFromServerCookies} from '@/utils/multiget';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

const FlexiHomepageView = dynamic(
  () => import('@/components/templates/flexipage/containers').then((d) => d.FlexipageContainer),
  {
    ssr: true
  }
);

type FlexiLandingPageProps = {
  _flexiPage: FlexiPageStructureModel[];
  _ssrCategories: CategoriesModel[];
  _ssrZipCode?: string;
  _handle: string;
};

const FlexiLandingPage: NextPage<FlexiLandingPageProps> = ({_flexiPage, _ssrZipCode, _handle}) => {
  const {t} = useTranslation();
  const {isReady, getBoolean} = useFeatureFlags();
  const isAddressFlowRevampEnabled = isReady && getBoolean(ACTIVATE_NEW_STOCK_SYSTEM);

  const {flexiPage, loading} = useFlexiPageClientData(_flexiPage, _handle, _ssrZipCode, isAddressFlowRevampEnabled);

  return (
    <ErrorBoundary>
      <Seo title={t('seo.title')} description={t('seo.description')} />
      <Box minHeight="80vh" textAlign="center">
        <FlexiHomepageView
          flexiPage={flexiPage}
          loading={loading}
          reorderList={[]}
          orderLoading={false}
          handle={_handle}
        />
      </Box>
    </ErrorBoundary>
  );
};

export async function getServerSideProps(
  context: GetServerSidePropsContext
): Promise<GetServerSidePropsResult<FlexiLandingPageProps>> {
  const {query, locale, req, defaultLocale} = context;

  const slug = query?.slug || '';
  if (!slug) {
    return {
      redirect: {
        destination: `/${locale || defaultLocale}`,
        permanent: false
      }
    };
  }

  const lang = locale || defaultLocale;
  const handle = getCategoryIdFromSlug(slug) || '';

  try {
    const {effectiveStoreCodes, currentStore} = await getStoreCodesFromServerCookies(req.headers.cookie);
    let storeCodes = effectiveStoreCodes;

    if (!storeCodes.length) {
      const defaultStoreCode = await MultiGetService.getDefaultStore();
      storeCodes = [defaultStoreCode.storeCode];
    }

    const {flexiPage} = await CmsService.getFlexiPageStructure(
      lang as string,
      handle,
      storeCodes,
      config.ACTIVATE_STOCK_HIGH
    );
    const {flexiCategories} = await CmsService.getFlexiPageStructure(lang);

    return {
      props: {
        ...(await loadSSRTransalation(locale, ['shared', 'order', 'stock', 'product', 'history'])),
        _flexiPage: JSON.parse(JSON.stringify(flexiPage)),
        _ssrCategories: JSON.parse(JSON.stringify(flexiCategories)),
        _ssrZipCode: currentStore?.zipcode,
        _handle: handle
      }
    };
  } catch (erro) {
    return {
      redirect: {
        destination: `/${locale || defaultLocale}/404`,
        permanent: false
      }
    };
  }
}

export default FlexiLandingPage;
