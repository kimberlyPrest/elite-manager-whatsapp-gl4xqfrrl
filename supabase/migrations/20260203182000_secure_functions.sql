-- Secure update_updated_at_column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Secure create_new_client
CREATE OR REPLACE FUNCTION create_new_client(
    p_client_data JSONB,
    p_products_data JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_client_id UUID;
    v_product JSONB;
    v_product_id UUID;
BEGIN
    -- Insert Client
    INSERT INTO clientes (
        nome_completo,
        primeiro_nome,
        sobrenome,
        telefone,
        whatsapp_number,
        email,
        segmento,
        nivel_engajamento,
        dor_principal,
        observacoes,
        potencial_upsell,
        pendente_classificacao
    ) VALUES (
        p_client_data->>'nome_completo',
        p_client_data->>'primeiro_nome',
        p_client_data->>'sobrenome',
        p_client_data->>'telefone',
        p_client_data->>'whatsapp_number',
        p_client_data->>'email',
        p_client_data->>'segmento',
        p_client_data->>'nivel_engajamento',
        p_client_data->>'dor_principal',
        p_client_data->>'observacoes',
        COALESCE((p_client_data->>'potencial_upsell')::boolean, false),
        COALESCE((p_client_data->>'pendente_classificacao')::boolean, false)
    ) RETURNING id INTO v_client_id;

    -- Process Products
    IF jsonb_array_length(p_products_data) > 0 THEN
        FOR v_product IN SELECT * FROM jsonb_array_elements(p_products_data)
        LOOP
            -- Insert into produtos_cliente
            INSERT INTO produtos_cliente (
                cliente_id,
                produto,
                status,
                num_calls_total,
                data_inicio,
                data_fim_prevista,
                observacoes_produto
            ) VALUES (
                v_client_id,
                v_product->>'produto',
                v_product->>'status',
                (v_product->>'num_calls_total')::integer,
                (v_product->>'data_inicio')::timestamp with time zone,
                (v_product->>'data_fim_prevista')::timestamp with time zone,
                v_product->>'observacoes_produto'
            ) RETURNING id INTO v_product_id;

            -- If Venda, insert into vendas
            IF (v_product->>'produto') = 'venda' THEN
                INSERT INTO vendas (
                    cliente_id,
                    status_venda,
                    data_criacao,
                    produto_interesse,
                    observacoes_venda
                ) VALUES (
                    v_client_id,
                    v_product->>'status',
                    NOW(),
                    'Consultoria',
                    v_product->>'observacoes_produto'
                );
            END IF;
        END LOOP;
    END IF;

    RETURN v_client_id;
EXCEPTION
    WHEN unique_violation THEN
        RAISE EXCEPTION 'Cliente com este telefone já existe';
    WHEN OTHERS THEN
        RAISE;
END;
$$;

-- Secure upsert_client_by_phone
CREATE OR REPLACE FUNCTION upsert_client_by_phone(
    p_phone TEXT,
    p_name TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_client_id UUID;
BEGIN
    -- Try to find existing client
    SELECT id INTO v_client_id FROM clientes WHERE telefone = p_phone OR whatsapp_number = p_phone LIMIT 1;
    
    -- If not found, create new
    IF v_client_id IS NULL THEN
        INSERT INTO clientes (nome_completo, telefone, whatsapp_number, data_inicio_consultoria, pendente_classificacao)
        VALUES (p_name, p_phone, p_phone, now(), true)
        RETURNING id INTO v_client_id;
    END IF;
    
    RETURN v_client_id;
END;
$$;
