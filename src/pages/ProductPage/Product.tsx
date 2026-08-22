import { useQuery } from "@tanstack/react-query";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import type { OptionValue, Product } from "../../types/db";
import styles from "./Product.module.css";
import { useState } from "react";
import { CreditCard, ShoppingCart } from "lucide-react";
import Spinner from "../../components/Spinner/Spinner";
import { calcPrice, formatCurrency, generateItemID } from "../../helper/helper";
import { getProductByID } from "../../services/Product";
import ErrorFallback from "../Error/ErrorFallback";
import { useCart } from "../../context/CartContext";

function Product() {
  // get url information
  const navigate = useNavigate()
  const { addItem } = useCart();
  const { id } = useParams<{ id: string }>();

  const location = useLocation();
  const initialValues: OptionValue[] = location.state || {};

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["product", id],
    queryFn: () => getProductByID(Number(id)),
    enabled: Boolean(id),
  });
  const [selections, setSelection] = useState(initialValues);

  if (isLoading) {
    return <Spinner pagination={false} />;
  }
  if (isError || !data) {
    return (
      <ErrorFallback
        error={error as Error}
        resetErrorBoundary={refetch} // Clicking 'Try Again' calls refetch()
      />
    );
  }
  const { product } = data;
  const handleSelectChange = (chosenValue: OptionValue) => {
    setSelection((prev) =>
      prev.map((selection) =>
        selection.optionID === chosenValue.optionID ? chosenValue : selection,
      ),
    );
  };
  console.log(selections);
  function handleAdd(e: React.MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();
    e.preventDefault();
    const item = {
      itemID: generateItemID(product, selections),
      product: product,
      options: selections,
      quantity: 1,
      itemPrice: finalPrice,
    };
    addItem(item);
  }
  const finalPrice = calcPrice(data.product, selections);

  return (
    <div className={styles.Product}>
      <div className={styles["image-box"]}>
        <img src={`${data.product.imageUrl}`} alt="" />
      </div>
      <div className={styles["content-box"]}>
        <div>
          <h3 className={styles.subHeader}>{data.product.category}</h3>
          <h1 className={styles.header}>{data.product.name}</h1>
          <div className={styles.description}>{data.product.description}</div>
          <div className={styles.features}>
            {data.options.map((op) => (
              <div key={op.id}>
                <img src={`${op.icon}`} alt="" />
                <span>{op.description}</span>
              </div>
            ))}
          </div>
          <form className={styles.options}>
            {data.options.map((option) => (
              <fieldset key={option.id} className={styles.optionGroup}>
                <legend>{`Select ${option.name}`}</legend>

                <div className={styles.choiceBar}>
                  {option.values.map((value) => {
                    return (
                      <label key={value.id} className={styles.choice}>
                        <input
                          type="radio"
                          required
                          name={`option-${option.id}`}
                          value={value.id}
                          checked={selections.some((v) => v.id === value.id)}
                          onChange={() => handleSelectChange(value)}
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
              <button
                className="premium-button premium-button-secondary"
                onClick={handleAdd}
              >
                <ShoppingCart />
                add to cart
              </button>
              <button
                className="premium-button premium-button-primary"
                onClick={() => navigate("/checkout")}
              >
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
