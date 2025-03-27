import {Await, useLoaderData, Link} from '@remix-run/react';
import {Suspense, useState} from 'react';
import {Image, Money} from '@shopify/hydrogen';
import clsx from 'clsx';
import {
  getDefaultOption,
  getSelectedVariant,
  getSelectedImage,
  getNextImage,
} from '~/utils/product';
import {COLOR_MAP} from '~/constants';

/**
 * @type {MetaFunction}
 */
export const meta = () => {
  return [{title: 'Hydrogen | Home'}];
};

/**
 * @param {LoaderFunctionArgs} args
 */
export async function loader(args) {
  // Start fetching non-critical data without blocking time to first byte
  const deferredData = loadDeferredData(args);

  // Await the critical data required to render initial state of the page
  const criticalData = await loadCriticalData(args);

  return {...deferredData, ...criticalData};
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 * @param {LoaderFunctionArgs}
 */
async function loadCriticalData({context}) {
  const [{collections}] = await Promise.all([
    context.storefront.query(FEATURED_COLLECTION_QUERY),
    // Add other queries here, so that they are loaded in parallel
  ]);

  return {
    featuredCollection: collections.nodes[0],
  };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 * @param {LoaderFunctionArgs}
 */
function loadDeferredData({context}) {
  const recommendedProducts = context.storefront
    .query(RECOMMENDED_PRODUCTS_QUERY)
    .catch((error) => {
      // Log query errors, but don't throw them so the page can still render
      console.error(error);
      return null;
    });

  return {
    recommendedProducts,
  };
}

export default function Homepage() {
  /** @type {LoaderReturnData} */
  const data = useLoaderData();
  return (
    <div className="mt-30">
      <FeaturedCollection collection={data.featuredCollection} />
      <RecommendedProducts products={data.recommendedProducts} />
    </div>
  );
}

/**
 * @param {{
 *   collection: FeaturedCollectionFragment;
 * }}
 */
function FeaturedCollection({collection}) {
  if (!collection) return null;
  const image = collection?.image;
  return (
    <Link
      className="featured-collection !hidden"
      to={`/collections/${collection.handle}`}
    >
      {image && (
        <div className="featured-collection-image">
          <Image data={image} sizes="100vw" />
        </div>
      )}
      <h1>{collection.title}</h1>
    </Link>
  );
}

/**
 * @param {{
 *   products: Promise<RecommendedProductsQuery | null>;
 * }}
 */
function RecommendedProducts({products}) {
  return (
    <>
      <Suspense fallback={<div>Loading...</div>}>
        <Await resolve={products}>
          {(response) => (
            // centered for this specific task only, because otherwise there is no need for it
            <div className="flex flex-wrap gap-4 place-content-center">
              {response?.products.nodes.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </Await>
      </Suspense>
    </>
  );
}

function ProductCard({product}) {
  const [selectedOption, setSelectedOption] = useState(
    getDefaultOption(product),
  );
  const selectedVariant = getSelectedVariant(product, selectedOption);
  const selectedImage = getSelectedImage(product, selectedOption);

  const selectedVariantPrice =
    selectedVariant?.price || product.priceRange.minVariantPrice;
  const selectedVariantCompareAtPrice = selectedVariant?.compareAtPrice || null;

  return (
    <div className="group flex flex-col gap-y-[0.9375rem]">
      <ProductImage
        product={product}
        selectedImage={selectedImage}
        selectedVariantCompareAtPrice={selectedVariantCompareAtPrice}
      />
      {product.options.length > 0 && (
        // some of the variants have different prices and "compare-at" prices to show that the price
        // on the card changes due to changing variants, and "On Sale” appears when it’s needed
        <ProductOptions
          options={product.options}
          selectedOption={selectedOption}
          setSelectedOption={setSelectedOption}
        />
      )}
      <ProductDetails
        product={product}
        selectedVariantPrice={selectedVariantPrice}
        selectedVariantCompareAtPrice={selectedVariantCompareAtPrice}
      />
    </div>
  );
}

function ProductImage({product, selectedImage, selectedVariantCompareAtPrice}) {
  const commonImageStyles =
    'object-contain transition-opacity duration-300 -z-1';

  return (
    <Link
      className="relative flex border border-silver box-content rounded-[0.625rem] w-[19.6875rem] h-[21.25rem]"
      to={`/products/${product.handle}`}
    >
      {selectedVariantCompareAtPrice && (
        // this tag text is hardcoded here, but it can be replaced as dynamic data depending on our needs
        <span
          className={clsx(
            'flex items-center absolute top-[1.25rem] start-[1.25rem] h-[1.8125rem] rounded-[1.5625rem] border border-red px-3',
            'font-medium text-red text-[0.9375rem]',
          )}
        >
          On Sale!
        </span>
      )}
      <Image
        data={selectedImage}
        sizes="(min-width: 45em) 20vw, 50vw"
        className={clsx(commonImageStyles, 'group-hover:opacity-0')}
      />
      {product.images.nodes.length > 1 && (
        <Image
          data={getNextImage(product.images.nodes, selectedImage)}
          sizes="(min-width: 45em) 20vw, 50vw"
          loading="lazy"
          className={clsx(
            commonImageStyles,
            'absolute start-0 top-0 size-full opacity-0 group-hover:opacity-100',
          )}
        />
      )}
    </Link>
  );
}

function ProductOptions({options, selectedOption, setSelectedOption}) {
  return options.map((option) => (
    <div key={option.id} className="flex gap-x-[0.3125rem]">
      {option.values.map((value) => (
        <button
          key={value}
          title={value}
          className={clsx(
            'relative rounded-full border size-[1.25rem]',
            {
              'border-white before:bg-primary before:absolute before:-start-[0.125rem] before:-top-[0.125rem] before:-z-1 before:rounded-full before:size-[1.375rem]':
                selectedOption === value,
              'border-transparent cursor-pointer': selectedOption !== value,
            },
            COLOR_MAP[value],
          )}
          onClick={(e) => {
            e.preventDefault();
            setSelectedOption(value);
          }}
        />
      ))}
    </div>
  ));
}

function ProductDetails({
  product,
  selectedVariantPrice,
  selectedVariantCompareAtPrice,
}) {
  return (
    <div className="flex flex-col gap-y-1.5">
      {/* it's worth using "em" for line height, as it depends proportionally on the font size */}
      <p className="text-sm leading-[1.14em] text-secondary">
        {product.vendor}
      </p>
      {/* TODO: don't forget about semanticaly correct tags where it's needed (H4 as an example here) */}
      <h4 className="font-medium leading-[1.125em] text-primary">
        <Link to={`/products/${product.handle}`}>{product.title}</Link>
      </h4>
      <p className="flex gap-x-2">
        {selectedVariantCompareAtPrice && (
          <span className="text-secondary leading-[1.14em] line-through">
            <Money data={selectedVariantCompareAtPrice} />
          </span>
        )}
        <Money
          data={selectedVariantPrice}
          className={clsx(
            selectedVariantCompareAtPrice ? 'text-red' : 'text-secondary',
            'leading-[1.14em]',
          )}
        />
      </p>
    </div>
  );
}

const FEATURED_COLLECTION_QUERY = `#graphql
  fragment FeaturedCollection on Collection {
    id
    title
    image {
      id
      url
      altText
      width
      height
    }
    handle
  }
  query FeaturedCollection($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    collections(first: 1, sortKey: UPDATED_AT, reverse: true) {
      nodes {
        ...FeaturedCollection
      }
    }
  }
`;

const RECOMMENDED_PRODUCTS_QUERY = `#graphql
  fragment RecommendedProduct on Product {
    id
    title
    vendor
    handle
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
    options {
      id
      name
      values
    }
    images(first: 12) {
      nodes {
        id
        url
        altText
        width
        height
      }
    }
    variants(first: 6) {
      nodes {
        id
        price {
          amount
          currencyCode
        }
        compareAtPrice {
          amount
          currencyCode
        }
        selectedOptions {
          name
          value
        }
      }
    }
  }
  query RecommendedProducts ($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    products(first: 4, sortKey: UPDATED_AT, reverse: true) {
      nodes {
        ...RecommendedProduct
      }
    }
  }
`;

/** @typedef {import('@shopify/remix-oxygen').LoaderFunctionArgs} LoaderFunctionArgs */
/** @template T @typedef {import('@remix-run/react').MetaFunction<T>} MetaFunction */
/** @typedef {import('storefrontapi.generated').FeaturedCollectionFragment} FeaturedCollectionFragment */
/** @typedef {import('storefrontapi.generated').RecommendedProductsQuery} RecommendedProductsQuery */
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */
