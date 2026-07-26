import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useSearchParams } from "react-router-dom";
import type { OptionValue, Product } from "../../types/db";
import styles from "./Product.module.css";
import { useEffect, useState } from "react";
import { CreditCard, ShoppingCart } from "lucide-react";
import Spinner from "../../components/Spinner/Spinner";
import { calcPrice, formatCurrency } from "../../helper/helper";
import { getProductByID } from "../../services/Product";
type SelectionsType = Record<number, OptionValue>;
function Product() {
  const queryClient = useQueryClient();

  // get url information
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const initialSizeID = Number(searchParams.get("size"));
  const initialRoastID = Number(searchParams.get("roast"));

  // fetch data
  const { data, isPending: isOptionsPending } = useQuery({
    queryKey: ["productOptions", id],
    queryFn: () => getProductByID(Number(id!)),
    enabled: !!id,
  });
  const options = data?.ProductOptions.map((op) => op.optionID);
  const [selections, setSelections] = useState<SelectionsType>({});

  // Sync default values into state once optionsData loads
  useEffect(() => {
    // Guard: Don't run if data isn't ready or selections are already set
    if (!options || Object.keys(selections).length > 0) return;

    const defaults: SelectionsType = {};

    options.forEach((option) => {
      // 1. Try to match specific initial IDs passed down via props/url
      let matchedValue;
      if (option.name === "size" && initialSizeID) {
        matchedValue = option.OptionValues.find((v) => v.id === initialSizeID);
      } else if (option.name === "roasting" && initialRoastID) {
        matchedValue = option.OptionValues.find((v) => v.id === initialRoastID);
      }

      // 2. Priority fallback: Target ID -> explicit 'default' flag -> first available value
      const defaultValue =
        matchedValue ||
        option.OptionValues.find((v) => v.default) ||
        option.OptionValues[0];

      if (defaultValue) {
        defaults[option.id] = defaultValue;
      }
    });

    setSelections(defaults);
  }, [options, initialSizeID, initialRoastID, selections]);
  const handleSelectChange = (itemID: number, chosenValue: OptionValue) => {
    setSelections((prev) => ({
      ...prev,
      [itemID]: chosenValue,
    }));
  };

  // fetching data
  const { data: product, isPending: isProductPending } = useQuery<Product>({
    queryKey: ["product", id],
    queryFn: () => getProductByID(Number(id!)),
    enabled: !!id,

    initialData: () => {
      const cachedProducts = queryClient.getQueryData<Product[]>(["products"]);

      return cachedProducts?.find((p) => String(p.id) === String(id));
    },
    initialDataUpdatedAt: () =>
      queryClient.getQueryState(["products"])?.dataUpdatedAt,
  });

  if (isProductPending || isOptionsPending)
    return <Spinner fullScreen size="lg" variant="gold" label="Loading..." />;
  if (!product) return <div>Coffee profile not found.</div>;
  if (!options) return <div>problem occurred loading object options.</div>;

  const finalPrice = calcPrice(product, Object.values(selections));

  return (
    <div className={styles.Product}>
      <div className={styles["image-box"]}>
        <img src={`${product.imageUrl}`} alt="" />
      </div>
      <div className={styles["content-box"]}>
        <div>
          <h3 className={styles.subHeader}>{product.category}</h3>
          <h1 className={styles.header}>{product.name}</h1>
          <div className={styles.description}>{product.description}</div>
          <div className={styles.features}>
            {options.map((op) => (
              <div key={op.id}>
                <img src={`${op.icon}`} alt="" />
                <span>{op.description}</span>
              </div>
            ))}
          </div>
          <form className={styles.options}>
            {options.map((option) => (
              <fieldset key={option.id} className={styles.optionGroup}>
                <legend>{`Select ${option.name}`}</legend>

                <div className={styles.choiceBar}>
                  {option.OptionValues.map((value) => {
                    return (
                      <label key={value.id} className={styles.choice}>
                        <input
                          type="radio"
                          required
                          name={`option-${option.id}`}
                          value={value.id}
                          checked={selections[option.id]?.id === value.id}
                          onChange={() => handleSelectChange(option.id, value)}
                        />

                        <span>{value.label}</span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            ))}
          </form>
          <div className={styles.callToAction}>
            <span className={styles.price}>{formatCurrency(finalPrice)}</span>
            <div className={styles.action}>
              <button className="premium-button premium-button-secondary">
                <ShoppingCart />
                add to cart
              </button>
              <button className="premium-button premium-button-primary">
                <CreditCard />
                checkout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default Product;
