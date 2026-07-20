import { useQuery, useQueryClient } from "@tanstack/react-query";
import { data, useParams, useSearchParams } from "react-router-dom";
import { getOptions, getProductByID } from "../../services/Product";
import type { Product, Option } from "../../types/db";
import { optionWithValue } from "../../types/customTypes";
import styles from './Product.module.css';

function Product() {
  const [searchParams] = useSearchParams();

  // 1. Grab initial configurations passed from the card link
  const initialSizeId = Number(searchParams.get("size")) || 3;
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const initialRoastId = searchParams.get("roast")
    ? Number(searchParams.get("roast"))
    : null;

  // 2. Fetch the single product detail, using the Menu list as initial state
  const { data: product, isPending: isProductPending } = useQuery<Product>({
    queryKey: ["product", id],
    queryFn: () => getProductByID(Number(id!)),
    enabled: !!id,

    // This is where the magic happens ✨
    initialData: () => {
      // Pull the complete array from the ["products"] key used in Menu
      const cachedProducts = queryClient.getQueryData<Product[]>(["products"]);

      // Pluck out the specific product matching this page's ID
      return cachedProducts?.find((p) => String(p.id) === String(id));
    },
    // Tells TanStack Query to consider the cache age relative to when the menu list updated
    initialDataUpdatedAt: () =>
      queryClient.getQueryState(["products"])?.dataUpdatedAt,
  });
  // 3. Fetch options. This triggers INSTANTLY with 0ms loading time
  // because the cache key matches the card's query exactly!

  const { data: optionsData, isPending: isOptionsPending } = useQuery<
    optionWithValue[]
  >({
    queryKey: ["productOptions", id],
    queryFn: () => getOptions(Number(id!)),
    enabled: !!id,
  });
  // 3. Set your local state on this page using the initial URL values
  // const [selectedSize, setSelectedSize] = useState(initialSizeId);

  // 2. Fetch options (size, roasting) independently

  // Fallback UI states
  if (isProductPending || isOptionsPending)
    return <div>Loading coffee details...</div>;

  if (!product) return <div>Coffee profile not found.</div>;
  if (!optionsData) return <div>problem occurred loading object options.</div>;

  return (
    <div className={styles.Product}>
      <div className={styles["image-box"]}>
        <img src={`${product.imageUrl}`} alt="" />
      </div>
      <div className={styles["content-box"]}>
        <div>
          <div>subheader</div>
          <div>header</div>
          <div>features</div>
          <div>Description</div>
          <button>add to cart</button>
          <button>checkout</button>
        </div>
        <form>
          {optionsData.map((option) => {
            console.log("this is option arr", option);
            console.log("this is option values", option.OptionValues);
            return (
              <div key={option.id}>
                <label
                  htmlFor={`${option.name}`}
                >{`Select ${option.name}`}</label>
                <select id={`${option.name}`}>
                  {option.OptionValues &&
                    option.OptionValues.map((value) => {
                      return (
                        <option
                          key={value.id}
                          value={`${value.label}`}
                        >{`${value.label}`}</option>
                      );
                    })}
                </select>
              </div>
            );
          })}
        </form>
      </div>
    </div>
  );
}
{
  /* <div className={styles["header"]}></div> */
}
{
  /* <div className={styles["image-option"]}>
          <div
            style={{
              backgroundImage:
                "url(https://bdksjsmaqssxasrlyzci.supabase.co/storage/v1/object/sign/images/Generated%20Image%20July%2019,%202026%20-%205_30PM%20(Edited).png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zYjY2MWEyMi1iMmIxLTRjMzctOTI5NS1kM2YyNDRjYjgwM2QiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJpbWFnZXMvR2VuZXJhdGVkIEltYWdlIEp1bHkgMTksIDIwMjYgLSA1XzMwUE0gKEVkaXRlZCkucG5nIiwic2NvcGUiOiJkb3dubG9hZCIsImlhdCI6MTc4NDQ3MjAyNiwiZXhwIjoyMDk5ODMyMDI2fQ.QfGGT14ehNtSgzhi5y7qbm-VG5-PisSL0sUjbvTTobg)",
            }}
          ></div>
        </div>
        <div className={styles["image-option"]}>
          <div
            style={{
              backgroundImage:
                "url(https://bdksjsmaqssxasrlyzci.supabase.co/storage/v1/object/sign/images/Generated%20Image%20July%2019,%202026%20-%205_32PM.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zYjY2MWEyMi1iMmIxLTRjMzctOTI5NS1kM2YyNDRjYjgwM2QiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJpbWFnZXMvR2VuZXJhdGVkIEltYWdlIEp1bHkgMTksIDIwMjYgLSA1XzMyUE0ucG5nIiwic2NvcGUiOiJkb3dubG9hZCIsImlhdCI6MTc4NDQ3MjIzOSwiZXhwIjoyMDk5ODMyMjM5fQ.oF9gjJolLw3Uak0xwjn4L_9l_fJWGhJxyNnyHERsF4U)",
            }}
          ></div>
        </div>
        <div className={styles["image-option"]}>
          <div
            style={{
              backgroundImage:
                "url(https://bdksjsmaqssxasrlyzci.supabase.co/storage/v1/object/sign/images/Generated%20Image%20July%2019,%202026%20-%205_33PM.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zYjY2MWEyMi1iMmIxLTRjMzctOTI5NS1kM2YyNDRjYjgwM2QiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJpbWFnZXMvR2VuZXJhdGVkIEltYWdlIEp1bHkgMTksIDIwMjYgLSA1XzMzUE0ucG5nIiwic2NvcGUiOiJkb3dubG9hZCIsImlhdCI6MTc4NDQ3MjI3MSwiZXhwIjoyMDk5ODMyMjcxfQ.KbYLt3uz1_LOcAGsNA0rjteucMRcsjxyCJAegUu-7Ls)",
            }}
          ></div>
        </div> */
}

export default Product;
