--
-- PostgreSQL database dump
--

\restrict jmWiWlvFmpnxpeoev2WzQnNyfUpOa9ZPc2FOTFLJU6mpBMFErlPUpwVPdqbQoUv

-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: orderStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."orderStatus" AS ENUM (
    'pending',
    'paid',
    'shipped',
    'completed',
    'cancelled'
);


--
-- Name: TYPE "orderStatus"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TYPE public."orderStatus" IS 'status of the current order';


--
-- Name: orderstatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.orderstatus AS ENUM (
    'pending',
    'paid',
    'shipped',
    'completed',
    'cancelled',
    'failed'
);


--
-- Name: role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.role AS ENUM (
    'admin',
    'user'
);


--
-- Name: create_order(text, text, text, text, text, text, text, text, text, text, numeric, numeric, text, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_order(p_customer_id text, p_customer_name text, p_customer_email text, p_customer_phone text, p_apartment text, p_street text, p_city text, p_cityid text, p_district text, p_districtid text, p_subtotal numeric, p_shipping_fees numeric, p_payment_method text, p_items jsonb) RETURNS bigint
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_order_id bigint;
  v_total_price numeric;
BEGIN
  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Order items must be a non-empty array';
  END IF;

  v_total_price := p_subtotal + p_shipping_fees;

  INSERT INTO public."Order" (
    "customer_ID",
    "customerName",
    "customerEmail",
    "customerPhone",
    "apartment",
    "street",
    "city",
    "cityID",
    "district",
    "districtID",
    "subTotal",
    "shippingFees",
    "totalPrice",
    "paymentMethod"
  )
  VALUES (
    p_customer_id,
    p_customer_name,
    p_customer_email,
    p_customer_phone,
    p_apartment,
    p_street,
    p_city,
    p_cityid,
    p_district,
    p_districtid,
    p_subtotal,
    p_shipping_fees,
    v_total_price,
    p_payment_method
  )
  RETURNING id INTO v_order_id;

  INSERT INTO public."OrderItem" (
    "productName",
    "quantity",
    "totalPrice",
    "productID",
    "orderID",
    "options"
  )
  SELECT
    item->>'productName',
    (item->>'quantity')::integer,
    (item->>'totalPrice')::numeric,
    (item->>'productID')::bigint,
    v_order_id,
    COALESCE(NULLIF(item->'options', 'null'::jsonb), '[]'::jsonb)
  FROM jsonb_array_elements(p_items) AS item;

  RETURN v_order_id;
END;
$$;


--
-- Name: rls_auto_enable(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rls_auto_enable() RETURNS event_trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: OptionValues; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."OptionValues" (
    id bigint NOT NULL,
    "optionID" smallint NOT NULL,
    label text NOT NULL,
    "inStock" boolean DEFAULT true NOT NULL,
    "priceModifier" real DEFAULT '0'::real NOT NULL,
    "default" boolean DEFAULT false NOT NULL
);


--
-- Name: TABLE "OptionValues"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public."OptionValues" IS 'values of selected option';


--
-- Name: COLUMN "OptionValues"."inStock"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."OptionValues"."inStock" IS 'if the actula option value of the product exist';


--
-- Name: Options; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Options" (
    id bigint NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    icon text NOT NULL
);


--
-- Name: TABLE "Options"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public."Options" IS 'possible options for product';


--
-- Name: Order; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Order" (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    "customerName" text NOT NULL,
    "customerEmail" text NOT NULL,
    "customerPhone" text NOT NULL,
    "totalPrice" numeric NOT NULL,
    "paymobOrderID" text,
    "paymobTransactionID" text,
    "paymentMethod" text NOT NULL,
    "paymentStatus" text DEFAULT 'pending'::text NOT NULL,
    "shippingStatus" text DEFAULT 'processing'::text NOT NULL,
    "bostaOrderID" text,
    "bostaTrackingNumber" text,
    "bostaTrackingUrl" text,
    apartment text NOT NULL,
    street text NOT NULL,
    city text NOT NULL,
    "cityID" text NOT NULL,
    district text NOT NULL,
    "districtID" text NOT NULL,
    "subTotal" numeric NOT NULL,
    "shippingFees" numeric NOT NULL,
    "customer_ID" text NOT NULL
);


--
-- Name: TABLE "Order"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public."Order" IS 'actual order the customer choose';


--
-- Name: COLUMN "Order".apartment; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Order".apartment IS 'customer apartment number or letter';


--
-- Name: COLUMN "Order".street; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Order".street IS 'customer street name';


--
-- Name: COLUMN "Order".city; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Order".city IS 'customer city name';


--
-- Name: OrderItem; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."OrderItem" (
    id bigint NOT NULL,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
    "productName" text NOT NULL,
    quantity smallint NOT NULL,
    "totalPrice" integer NOT NULL,
    "productID" bigint NOT NULL,
    "orderID" bigint NOT NULL,
    options jsonb NOT NULL
);


--
-- Name: TABLE "OrderItem"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public."OrderItem" IS 'items for current order or cart';


--
-- Name: OrderItem_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public."OrderItem" ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public."OrderItem_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: Order_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public."Order" ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public."Order_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: Product; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Product" (
    id bigint NOT NULL,
    name text NOT NULL,
    price integer NOT NULL,
    "imageUrl" text NOT NULL,
    "inStock" boolean DEFAULT true NOT NULL,
    featured boolean DEFAULT false NOT NULL,
    description text NOT NULL,
    category text NOT NULL,
    "blurred-image" text NOT NULL,
    CONSTRAINT "Product_price_check" CHECK ((price >= 0))
);


--
-- Name: TABLE "Product"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public."Product" IS 'kinds of Product i have';


--
-- Name: ProductOptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ProductOptions" (
    id bigint NOT NULL,
    "productID" bigint NOT NULL,
    "optionID" bigint NOT NULL
);


--
-- Name: ProductOptions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public."ProductOptions" ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public."ProductOptions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: account; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.account (
    id text NOT NULL,
    issuer text,
    "accountId" text NOT NULL,
    "providerId" text NOT NULL,
    "userId" text NOT NULL,
    "accessToken" text,
    "refreshToken" text,
    "idToken" text,
    "accessTokenExpiresAt" timestamp with time zone,
    "refreshTokenExpiresAt" timestamp with time zone,
    scope text,
    password text,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: rateLimit; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."rateLimit" (
    id text NOT NULL,
    key text NOT NULL,
    count integer NOT NULL,
    "lastRequest" bigint NOT NULL
);


--
-- Name: session; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.session (
    id text NOT NULL,
    "expiresAt" timestamp with time zone NOT NULL,
    token text NOT NULL,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "ipAddress" text,
    "userAgent" text,
    "userId" text NOT NULL
);


--
-- Name: user; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."user" (
    id text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    "emailVerified" boolean NOT NULL,
    image text,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    role text DEFAULT 'user'::text NOT NULL
);


--
-- Name: verification; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.verification (
    id text NOT NULL,
    identifier text NOT NULL,
    value text NOT NULL,
    "expiresAt" timestamp with time zone NOT NULL,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: OrderItem OrderItem_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OrderItem"
    ADD CONSTRAINT "OrderItem_pkey" PRIMARY KEY (id);


--
-- Name: Order Order_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_pkey" PRIMARY KEY (id);


--
-- Name: OptionValues ProductOptionValue_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OptionValues"
    ADD CONSTRAINT "ProductOptionValue_pkey" PRIMARY KEY (id);


--
-- Name: Options ProductOption_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Options"
    ADD CONSTRAINT "ProductOption_pkey" PRIMARY KEY (id);


--
-- Name: ProductOptions ProductOptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ProductOptions"
    ADD CONSTRAINT "ProductOptions_pkey" PRIMARY KEY (id);


--
-- Name: Product Product_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_pkey" PRIMARY KEY (id);


--
-- Name: account account_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.account
    ADD CONSTRAINT account_pkey PRIMARY KEY (id);


--
-- Name: rateLimit rateLimit_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."rateLimit"
    ADD CONSTRAINT "rateLimit_key_key" UNIQUE (key);


--
-- Name: rateLimit rateLimit_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."rateLimit"
    ADD CONSTRAINT "rateLimit_pkey" PRIMARY KEY (id);


--
-- Name: session session_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT session_pkey PRIMARY KEY (id);


--
-- Name: session session_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT session_token_key UNIQUE (token);


--
-- Name: user user_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_email_key UNIQUE (email);


--
-- Name: user user_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_pkey PRIMARY KEY (id);


--
-- Name: verification verification_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verification
    ADD CONSTRAINT verification_pkey PRIMARY KEY (id);


--
-- Name: OptionValues_optionID_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "OptionValues_optionID_idx" ON public."OptionValues" USING btree ("optionID");


--
-- Name: OrderItem_productID_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "OrderItem_productID_idx" ON public."OrderItem" USING btree ("productID");


--
-- Name: Order_bostaOrderID_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Order_bostaOrderID_idx" ON public."Order" USING btree ("bostaOrderID");


--
-- Name: Order_customer_ID_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Order_customer_ID_idx" ON public."Order" USING btree ("customer_ID");


--
-- Name: ProductOptions_optionID_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ProductOptions_optionID_idx" ON public."ProductOptions" USING btree ("optionID");


--
-- Name: ProductOptions_productID_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ProductOptions_productID_idx" ON public."ProductOptions" USING btree ("productID");


--
-- Name: account_issuer_accountId_uidx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "account_issuer_accountId_uidx" ON public.account USING btree (issuer, "accountId");


--
-- Name: account_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "account_userId_idx" ON public.account USING btree ("userId");


--
-- Name: options_name_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX options_name_idx ON public."Options" USING btree (name);


--
-- Name: order_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX order_created_at_idx ON public."Order" USING btree (created_at DESC);


--
-- Name: orderitem_order_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX orderitem_order_idx ON public."OrderItem" USING btree ("orderID");


--
-- Name: product_featured_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX product_featured_idx ON public."Product" USING btree (featured);


--
-- Name: session_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "session_userId_idx" ON public.session USING btree ("userId");


--
-- Name: verification_identifier_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX verification_identifier_idx ON public.verification USING btree (identifier);


--
-- Name: OrderItem OrderItem_orderID_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OrderItem"
    ADD CONSTRAINT "OrderItem_orderID_fkey" FOREIGN KEY ("orderID") REFERENCES public."Order"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: OrderItem OrderItem_productID_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OrderItem"
    ADD CONSTRAINT "OrderItem_productID_fkey" FOREIGN KEY ("productID") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Order Order_customer_ID_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_customer_ID_fkey" FOREIGN KEY ("customer_ID") REFERENCES public."user"(id);


--
-- Name: OptionValues ProductOptionValue_optionID_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OptionValues"
    ADD CONSTRAINT "ProductOptionValue_optionID_fkey" FOREIGN KEY ("optionID") REFERENCES public."Options"(id) ON DELETE CASCADE;


--
-- Name: ProductOptions ProductOptions_optionID_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ProductOptions"
    ADD CONSTRAINT "ProductOptions_optionID_fkey" FOREIGN KEY ("optionID") REFERENCES public."Options"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ProductOptions ProductOptions_productID_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ProductOptions"
    ADD CONSTRAINT "ProductOptions_productID_fkey" FOREIGN KEY ("productID") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: account account_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.account
    ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."user"(id) ON DELETE CASCADE;


--
-- Name: session session_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."user"(id) ON DELETE CASCADE;


--
-- Name: OptionValues Enable read access for all users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable read access for all users" ON public."OptionValues" FOR SELECT USING (true);


--
-- Name: Options Enable read access for all users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable read access for all users" ON public."Options" FOR SELECT USING (true);


--
-- Name: Product Enable read access for all users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable read access for all users" ON public."Product" FOR SELECT USING (true);


--
-- Name: ProductOptions Enable read access for all users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable read access for all users" ON public."ProductOptions" FOR SELECT USING (true);


--
-- Name: OptionValues; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public."OptionValues" ENABLE ROW LEVEL SECURITY;

--
-- Name: Options; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public."Options" ENABLE ROW LEVEL SECURITY;

--
-- Name: Order; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public."Order" ENABLE ROW LEVEL SECURITY;

--
-- Name: OrderItem; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public."OrderItem" ENABLE ROW LEVEL SECURITY;

--
-- Name: Product; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public."Product" ENABLE ROW LEVEL SECURITY;

--
-- Name: ProductOptions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public."ProductOptions" ENABLE ROW LEVEL SECURITY;

--
-- Name: account; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.account ENABLE ROW LEVEL SECURITY;

--
-- Name: rateLimit; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public."rateLimit" ENABLE ROW LEVEL SECURITY;

--
-- Name: session; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.session ENABLE ROW LEVEL SECURITY;

--
-- Name: user; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public."user" ENABLE ROW LEVEL SECURITY;

--
-- Name: verification; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.verification ENABLE ROW LEVEL SECURITY;

--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: -
--

GRANT USAGE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;


--
-- Name: FUNCTION create_order(p_customer_id text, p_customer_name text, p_customer_email text, p_customer_phone text, p_apartment text, p_street text, p_city text, p_cityid text, p_district text, p_districtid text, p_subtotal numeric, p_shipping_fees numeric, p_payment_method text, p_items jsonb); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.create_order(p_customer_id text, p_customer_name text, p_customer_email text, p_customer_phone text, p_apartment text, p_street text, p_city text, p_cityid text, p_district text, p_districtid text, p_subtotal numeric, p_shipping_fees numeric, p_payment_method text, p_items jsonb) FROM PUBLIC;
GRANT ALL ON FUNCTION public.create_order(p_customer_id text, p_customer_name text, p_customer_email text, p_customer_phone text, p_apartment text, p_street text, p_city text, p_cityid text, p_district text, p_districtid text, p_subtotal numeric, p_shipping_fees numeric, p_payment_method text, p_items jsonb) TO service_role;


--
-- Name: FUNCTION rls_auto_enable(); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM PUBLIC;
GRANT ALL ON FUNCTION public.rls_auto_enable() TO service_role;


--
-- Name: TABLE "OptionValues"; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public."OptionValues" TO anon;
GRANT ALL ON TABLE public."OptionValues" TO authenticated;
GRANT ALL ON TABLE public."OptionValues" TO service_role;


--
-- Name: TABLE "Options"; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public."Options" TO anon;
GRANT ALL ON TABLE public."Options" TO authenticated;
GRANT ALL ON TABLE public."Options" TO service_role;


--
-- Name: TABLE "Order"; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public."Order" TO anon;
GRANT ALL ON TABLE public."Order" TO authenticated;
GRANT ALL ON TABLE public."Order" TO service_role;


--
-- Name: TABLE "OrderItem"; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public."OrderItem" TO anon;
GRANT ALL ON TABLE public."OrderItem" TO authenticated;
GRANT ALL ON TABLE public."OrderItem" TO service_role;


--
-- Name: SEQUENCE "OrderItem_id_seq"; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public."OrderItem_id_seq" TO anon;
GRANT ALL ON SEQUENCE public."OrderItem_id_seq" TO authenticated;
GRANT ALL ON SEQUENCE public."OrderItem_id_seq" TO service_role;


--
-- Name: SEQUENCE "Order_id_seq"; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public."Order_id_seq" TO anon;
GRANT ALL ON SEQUENCE public."Order_id_seq" TO authenticated;
GRANT ALL ON SEQUENCE public."Order_id_seq" TO service_role;


--
-- Name: TABLE "Product"; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public."Product" TO anon;
GRANT ALL ON TABLE public."Product" TO authenticated;
GRANT ALL ON TABLE public."Product" TO service_role;


--
-- Name: TABLE "ProductOptions"; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public."ProductOptions" TO anon;
GRANT ALL ON TABLE public."ProductOptions" TO authenticated;
GRANT ALL ON TABLE public."ProductOptions" TO service_role;


--
-- Name: SEQUENCE "ProductOptions_id_seq"; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public."ProductOptions_id_seq" TO anon;
GRANT ALL ON SEQUENCE public."ProductOptions_id_seq" TO authenticated;
GRANT ALL ON SEQUENCE public."ProductOptions_id_seq" TO service_role;


--
-- Name: TABLE account; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.account TO anon;
GRANT ALL ON TABLE public.account TO authenticated;
GRANT ALL ON TABLE public.account TO service_role;


--
-- Name: TABLE "rateLimit"; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public."rateLimit" TO anon;
GRANT ALL ON TABLE public."rateLimit" TO authenticated;
GRANT ALL ON TABLE public."rateLimit" TO service_role;


--
-- Name: TABLE session; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.session TO anon;
GRANT ALL ON TABLE public.session TO authenticated;
GRANT ALL ON TABLE public.session TO service_role;


--
-- Name: TABLE "user"; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public."user" TO anon;
GRANT ALL ON TABLE public."user" TO authenticated;
GRANT ALL ON TABLE public."user" TO service_role;


--
-- Name: TABLE verification; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.verification TO anon;
GRANT ALL ON TABLE public.verification TO authenticated;
GRANT ALL ON TABLE public.verification TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- PostgreSQL database dump complete
--

\unrestrict jmWiWlvFmpnxpeoev2WzQnNyfUpOa9ZPc2FOTFLJU6mpBMFErlPUpwVPdqbQoUv

