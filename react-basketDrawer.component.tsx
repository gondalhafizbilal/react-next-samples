import {FC, useEffect, useState} from 'react';

import {Box, Divider} from '@mui/material';
import {useTranslation} from 'next-i18next';
import {useRouter} from 'next/router';

import {BasketDrawerBody} from '@/components/organisms/basketDrawerBody/components';
import {BasketDrawerFooter} from '@/components/organisms/basketDrawerFooter';
import {BasketDrawerHeader} from '@/components/organisms/basketDrawerHeader/components';
import {BasketPopUpDialog} from '@/components/organisms/basketUpdatePopup/components';
import ProductItem from '@/components/organisms/basketUpdatePopup/components/productItem.component';
import {
  BASKET_DELIVERY_ADDRESS_ENABLED,
  REMOVE_BASKET_OOS_FRICTION,
  WEB_LOYALTY_DASHBOARD,
  BASKET_API_IMPROVEMENTS_ENABLED,
  WEB_DISABLE_CHECKOUT_ON_INCOMPLETE_ADDRESS,
  WEB_ENABLE_ADDRESS_FLOW_REVAMP
} from '@/configs/firebase/remoteConfigKey';
import {useFeatureFlags} from '@/contexts/FeatureFlags.context';
import {useApp} from '@/hooks/useApp';
import {useBasket} from '@/hooks/useBasket';
import {useSession} from '@/hooks/useSession';
import {BasketLineItem} from '@/services/basket/types';
import {UserAddress} from '@/services/checkout/types';
import {filterUnavailableProducts, hasItemsInBasket} from '@/utils/basket';
import {isCustomerEmailVerified} from '@/utils/customer';
import {getProductAvailability} from '@/utils/product';
import {errorToast, infoToast} from '@/utils/toast';

import {AddressDrawer} from '../../addressDrawer/containers';
import {StyledBasketDrawer, StyledSectionContentContainer, StyledSectionWrap} from '../styles';
import {BasketDrawerProps, IBasektAffectedModalData} from '../types';
import {AddressFormView} from './addressFormView.component';

export const BasketDrawerView: FC<BasketDrawerProps> = ({open, toggleBasketDrawer}) => {
  const {t} = useTranslation(['basket', 'common', 'order']);
  const [isAddressDrawerOpen, setAddressDrawerOpen] = useState<boolean>(false);
  const toggleAddressDrawer = () => setAddressDrawerOpen(!isAddressDrawerOpen);
  const [isAddressFormModalOpen, setIsAddressFormModalOpen] = useState<boolean>(false);
  const [addressBeingEdited, setAddressBeingEdited] = useState<UserAddress>();
  const [basketAffectedModalData, setBasketAffectedModalData] = useState<IBasektAffectedModalData>({
    modalShown: false,
    quantityUpdatedItems: 0,
    notReadyToPurchase: 0
  });

  const {
    basket,
    handleCheckout,
    loading,
    getBasketData,
    cancelRedeemPoints,
    getLoyaltyPoints,
    isLoadingShippingAddress: isLoadingAddress,
    selectedShippingAddress: shippingAddress,
    fetchUserAddresses,
    varientIdsOfItemThatWasAdjustedQuantity,
    removeUnavailableItems: bulkDeleteUnavailableItems,
    refreshBasket,
    basketQuantityChangedProductMap,
    setBasketQuantityChangedProductMap
  } = useBasket();
  const router = useRouter();
  const {user, status: userStatus} = useSession();
  const {currentStore, isMakroClickUserAndConfigEnabled} = useApp();
  const {userAddressList} = useBasket();
  const currentStoreCodes = currentStore?.stores?.map((store) => store.storeCode) ?? [];
  const {getBoolean, isReady} = useFeatureFlags();

  const isLoyaltyWebDashboardEnabled = isReady && getBoolean(WEB_LOYALTY_DASHBOARD);
  const isDeliveryAddressSelectionEnabled = isReady && getBoolean(BASKET_DELIVERY_ADDRESS_ENABLED);
  const isRemoveBasketOOSFrictionFeatureEnabled = isReady && getBoolean(REMOVE_BASKET_OOS_FRICTION);
  const isBasketApiImprovementsEnabled = getBoolean(BASKET_API_IMPROVEMENTS_ENABLED);
  const isDisableCheckoutButtonOnIncompleteAddressEnabled = getBoolean(WEB_DISABLE_CHECKOUT_ON_INCOMPLETE_ADDRESS);
  const isAddressFlowRevampEnabled = isReady && getBoolean(WEB_ENABLE_ADDRESS_FLOW_REVAMP);

  const hasProductInBasket = hasItemsInBasket(basket);
  const unavailableProducts = basket?.unavailableItems || [];

  useEffect(() => {
    if (isMakroClickUserAndConfigEnabled && isLoyaltyWebDashboardEnabled && getLoyaltyPoints) {
      getLoyaltyPoints();
    }
  }, [isMakroClickUserAndConfigEnabled, isLoyaltyWebDashboardEnabled, getLoyaltyPoints]);

  const renderAffectedBasketProduct = (itm: BasketLineItem, key: number) => {
    const shownQuantityReduceSign = varientIdsOfItemThatWasAdjustedQuantity.includes(itm.variantId);
    let originPrice = itm.productDetails.originPrice;
    let displayPrice = itm.productDetails.displayPrice;
    const [variant] = itm.productDetails.variants;
    originPrice = parseFloat(variant.compareAtPrice);
    if (itm.promotedPrice) {
      displayPrice = itm.promotedPrice;
    } else {
      displayPrice = variant.price;
    }

    const previousQuantity = basketQuantityChangedProductMap[itm.variantId]?.previousQuantity;

    const {status: productStatus, isAvailable} = getProductAvailability(itm.productDetails, currentStoreCodes);

    return (
      <Box key={itm.id}>
        <ProductItem
          isProductUnavailable={!isAvailable}
          productUnavailableText={t(`label.${productStatus}`)}
          title={itm.productDetails.title}
          coverImageURL={itm.productDetails.imageUrls[0]}
          originPrice={originPrice}
          displayPrice={displayPrice}
          priceUnit={itm.productDetails.priceUnit}
          quantity={itm.quantity}
          weight={itm.productDetails?.size || ''}
          productURL={`/p/${itm.productId}`}
          maxQuantity={itm.productDetails.totalInventory}
          promotedPrice={itm.productDetails.promotedPrice}
          shownQuantityReduceSign={shownQuantityReduceSign}
          previousQauntity={previousQuantity}
        />
        {basket.basketItems.length - 1 === key ? null : <Divider />}
      </Box>
    );
  };

  const renderBasketAffectedModalBody = (): JSX.Element => {
    const quantityChangedProducts =
      basket?.basketItems?.filter((lineItem) => {
        return Boolean(basketQuantityChangedProductMap[lineItem.variantId]);
      }) || [];

    const productChanges: BasketLineItem[] = unavailableProducts.concat(quantityChangedProducts);

    return (
      <StyledSectionWrap className={`${productChanges.length > 1 ? 'multiple' : 'single'}`}>
        <StyledSectionContentContainer>
          {productChanges.map((itm, key) => {
            return renderAffectedBasketProduct(itm, key);
          })}
        </StyledSectionContentContainer>
      </StyledSectionWrap>
    );
  };

  const processPostCheckoutClick = (isOOSProductsPresent: boolean) => {
    if (!user || !user?.accessToken) {
      return router.push(`/auth/login`, undefined, {locale: router.locale || router.defaultLocale});
    }

    if (isCustomerEmailVerified(user, true)) {
      // when the user click checkout, we will re-fetch the most updated items inventory
      // and validate first if the user should still be able to checkout

      const validateCheckout = (newlyFetchedItems: BasketLineItem[]) => {
        const newUnavailableItems = filterUnavailableProducts(newlyFetchedItems, currentStoreCodes);
        if (newUnavailableItems.length > 0) {
          errorToast(t<string>('message.productsAreOutOfStock'));
          !isBasketApiImprovementsEnabled && getBasketData(); // reload checkout drawer UI
          return false;
        }
        return true;
      };

      return handleCheckout(validateCheckout);
    } else {
      errorToast(t<string>('message.verifyEmailToCheckout'));
      if (open) {
        toggleBasketDrawer();
      }
    }
  };

  const newOnCheckoutClick = (isOOSProductsDeleted = false) => {
    const hasUnavailableProducts = unavailableProducts.length > 0;
    const productsCountWhoseQuantityGotAdjusted = Object.keys(basketQuantityChangedProductMap).length;
    if (!isOOSProductsDeleted) {
      const isModalShown = productsCountWhoseQuantityGotAdjusted > 0 || hasUnavailableProducts;
      if (isModalShown) {
        setBasketAffectedModalData({
          ...basketAffectedModalData,
          modalShown: isModalShown,
          notReadyToPurchase: unavailableProducts.length,
          quantityUpdatedItems: productsCountWhoseQuantityGotAdjusted
        });
        return;
      }
    } else {
      setBasketAffectedModalData({
        ...basketAffectedModalData,
        modalShown: false
      });
    }

    processPostCheckoutClick(false);
  };

  const previousOnCheckoutClick = () => {
    const hasOutOfStockProducts = unavailableProducts.length > 0;
    if (hasOutOfStockProducts) {
      errorToast(t<string>('message.removeOutOfStockProducts'));
      return;
    }

    processPostCheckoutClick(hasOutOfStockProducts);
  };

  const isDisabledCheckoutBtn = () => {
    const basketTotal = basket.prices?.totalDisplayPricePostVoucher || 0;
    const noCurrentStore = !currentStore?.stores?.length;
    const isSelectedAddressIsIncomplete = !shippingAddress;

    return (
      (isDisableCheckoutButtonOnIncompleteAddressEnabled && (isSelectedAddressIsIncomplete || isLoadingAddress)) ||
      loading ||
      !hasProductInBasket ||
      basketTotal < (basket?.minimumSpend || 0) ||
      noCurrentStore
    );
  };

  const handleCancelRedeemLoyaltyPoints = async () => {
    try {
      await cancelRedeemPoints(true);
    } catch (error: any) {
      throw new Error(error);
    }
  };

  const handleConfirmAndContinue = async () => {
    try {
      await bulkDeleteUnavailableItems();
      await refreshBasket();
      setBasketQuantityChangedProductMap({});
      await newOnCheckoutClick(true);
    } catch (error: any) {
      errorToast(error.message || t<string>('global.message.somethingWentWrong', {ns: 'common'}));
    } finally {
      setBasketAffectedModalData({
        modalShown: false,
        notReadyToPurchase: 0,
        quantityUpdatedItems: 0
      });
    }
  };

  const onShipToClickHandle = () => {
    if (isDeliveryAddressSelectionEnabled) {
      const needToOpenAddressForm = !shippingAddress;
      if (userStatus === 'authenticated' && needToOpenAddressForm) {
        setIsAddressFormModalOpen(true);
      } else {
        toggleAddressDrawer();
      }
    } else return;
  };

  const editAddress = (address: UserAddress) => {
    setAddressBeingEdited(address);
    setIsAddressFormModalOpen(true);
  };

  const onCheckoutClick = () => {
    if (isAddressFlowRevampEnabled) {
      if (!shippingAddress?.id) {
        if (userAddressList?.length) {
          toggleAddressDrawer();
          infoToast(t<string>('message.selectShippingAddress'));
          return;
        } else {
          toggleAddressDrawer();
          setIsAddressFormModalOpen(true);
          infoToast(t<string>('message.completeShippingAddress'));
          return;
        }
      }
    }
    if (isRemoveBasketOOSFrictionFeatureEnabled) {
      newOnCheckoutClick(false);
    } else {
      previousOnCheckoutClick();
    }
  };

  return (
    <>
      <StyledBasketDrawer variant="temporary" anchor="right" open={open} onClose={toggleBasketDrawer}>
        <BasketDrawerHeader
          title={t('title')}
          toggleBasketDrawer={toggleBasketDrawer}
          address={shippingAddress as UserAddress}
          isLoadingAddress={isLoadingAddress}
          onShipToClick={() => onShipToClickHandle()}
        />
        <BasketDrawerBody toggleBasketDrawer={toggleBasketDrawer} onPointsRemove={handleCancelRedeemLoyaltyPoints} />
        <BasketDrawerFooter
          onCheckoutClick={onCheckoutClick}
          toggleBasketDrawer={toggleBasketDrawer}
          isCheckoutDisabled={isDisabledCheckoutBtn()}
        />
      </StyledBasketDrawer>
      <AddressDrawer
        title={t('label.shippingAddress')}
        open={isAddressDrawerOpen}
        toggleAddressDrawer={toggleAddressDrawer}
        onNewAddress={() => {
          setAddressBeingEdited(undefined);
          setIsAddressFormModalOpen(true);
        }}
        onEditAddress={editAddress}
      />
      <BasketPopUpDialog
        open={basketAffectedModalData.modalShown}
        title={t('label.productListChanged')}
        notReadyToPurchaseCount={basketAffectedModalData.notReadyToPurchase}
        quantityUpdatedItems={basketAffectedModalData.quantityUpdatedItems}
        modalInfo={
          basketAffectedModalData.notReadyToPurchase == 0 && basketAffectedModalData.quantityUpdatedItems > 0
            ? ''
            : t('message.OOSRemovalMessase')
        }
        confrmButtonText={t('button.confirm&continue')}
        onGoBack={() => {
          setBasketAffectedModalData({
            ...basketAffectedModalData,
            modalShown: false
          });
        }}
        loading={loading}
        onConfirmAndContinue={handleConfirmAndContinue}
      >
        {renderBasketAffectedModalBody()}
      </BasketPopUpDialog>

      {isDeliveryAddressSelectionEnabled && isAddressFormModalOpen ? (
        <AddressFormView
          modalOpen={isAddressFormModalOpen}
          setModalOpen={setIsAddressFormModalOpen}
          address={addressBeingEdited}
          onFormSubmit={() => {
            fetchUserAddresses();
          }}
        />
      ) : null}
    </>
  );
};

BasketDrawerView.displayName = 'BasketDrawerView';
