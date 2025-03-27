import {Money} from '@shopify/hydrogen';
import clsx from 'clsx';

/**
 * @param {{
 *   price?: MoneyV2;
 *   compareAtPrice?: MoneyV2 | null;
 * }}
 */
export function ProductPrice({price, compareAtPrice}) {
  return (
    <div className="product-price">
      {compareAtPrice ? (
        <div className="flex gap-x-2">
          {price ? (
            <Money
              data={price}
              className={clsx(
                compareAtPrice ? 'text-red' : 'text-secondary',
                'leading-[1.14em]',
              )}
            />
          ) : null}
          <s>
            <Money
              data={compareAtPrice}
              className="text-secondary leading-[1.14em] line-through"
            />
          </s>
        </div>
      ) : price ? (
        <Money data={price} className="text-secondary leading-[1.14em]" />
      ) : (
        <span>&nbsp;</span>
      )}
    </div>
  );
}

/** @typedef {import('@shopify/hydrogen/storefront-api-types').MoneyV2} MoneyV2 */
