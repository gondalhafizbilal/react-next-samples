import React from 'react';
import { MdOutlineLocalShipping } from 'react-icons/md';
import { AiOutlineShop } from 'react-icons/ai';

const DeliveryMethodSelector = ({ selectedOption, setSelectedOption }) => {
  const handleRadioChange = (event) => {
    setSelectedOption(event.target.value);
  };

  return (
    <div>
      <h2 className="mb-3 text-2xl font-semibold text-gray-800">Delivery</h2>
      <div>
        <label
          className={
            selectedOption === 'ship'
              ? 'flex w-full cursor-pointer items-center justify-between rounded-t-md border border-primary-400 bg-primary-100 p-4 pr-6'
              : 'flex w-full cursor-pointer items-center justify-between rounded-t-md border border-b-0 p-4 pr-6 focus-within:border focus-within:border-primary-400 focus-within:bg-primary-100'
          }
          htmlFor="ship"
        >
          <div className="flex items-center gap-4">
            <input
              name="deliveryMethodSelector"
              value="ship"
              checked={selectedOption === 'ship'}
              onChange={handleRadioChange}
              id="ship"
              type="radio"
              className="relative h-4.5 w-4.5 cursor-pointer appearance-none rounded-full after:absolute after:top-0 after:h-4.5 after:w-4.5 after:rounded-full after:border after:bg-white after:transition-all after:duration-100 after:checked:border-6 after:checked:border-primary-300"
            />
            <span className="text-sm">Ship</span>
          </div>
          <span>
            <MdOutlineLocalShipping
              size={18}
              className={
                selectedOption === 'ship' ? 'text-primary-300' : 'text-gray-500'
              }
            />
          </span>
        </label>

        <label
          className={
            selectedOption === 'delivery'
              ? 'flex w-full cursor-pointer items-center justify-between rounded-b-md border border-primary-400 bg-primary-100 p-4 pr-6'
              : 'flex w-full cursor-pointer items-center justify-between rounded-b-md border border-t-0 p-4 pr-6 focus-within:rounded-b-md focus-within:border focus-within:border-primary-400 focus-within:bg-primary-100'
          }
          htmlFor="delivery"
        >
          <div className="flex items-center gap-4">
            <input
              className="relative h-4.5 w-4.5 cursor-pointer appearance-none rounded-full after:absolute after:top-0 after:h-4.5 after:w-4.5 after:rounded-full after:border after:bg-white after:transition-all after:duration-100 after:checked:border-6 after:checked:border-primary-300"
              checked={selectedOption === 'delivery'}
              value="delivery"
              onChange={handleRadioChange}
              name="deliveryMethodSelector"
              id="delivery"
              type="radio"
            />
            <span className="text-sm">Delivery</span>
          </div>
          <span>
            <AiOutlineShop
              size={18}
              className={
                selectedOption === 'delivery'
                  ? 'text-primary-300'
                  : 'text-gray-500'
              }
            />
          </span>
        </label>
      </div>
    </div>
  );
};

export default DeliveryMethodSelector;
