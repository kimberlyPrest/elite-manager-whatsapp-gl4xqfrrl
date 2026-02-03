// AVOID UPDATING THIS FILE DIRECTLY. It is automatically generated.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.1'
  }
  public: {
    Tables: {
      automacoes_massa: {
        Row: {
          created_at: string
          data_conclusao: string | null
          data_inicio: string | null
          id: string
          intervalo_max_segundos: number | null
          intervalo_min_segundos: number | null
          mensagem_template: string
          status_automacao: string
          tempo_estimado_segundos: number | null
          tipo_selecao: string
          total_envios_concluidos: number | null
          total_envios_falhados: number | null
          total_envios_planejados: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_conclusao?: string | null
          data_inicio?: string | null
          id?: string
          intervalo_max_segundos?: number | null
          intervalo_min_segundos?: number | null
          mensagem_template: string
          status_automacao: string
          tempo_estimado_segundos?: number | null
          tipo_selecao: string
          total_envios_concluidos?: number | null
          total_envios_falhados?: number | null
          total_envios_planejados?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_conclusao?: string | null
          data_inicio?: string | null
          id?: string
          intervalo_max_segundos?: number | null
          intervalo_min_segundos?: number | null
          mensagem_template?: string
          status_automacao?: string
          tempo_estimado_segundos?: number | null
          tipo_selecao?: string
          total_envios_concluidos?: number | null
          total_envios_falhados?: number | null
          total_envios_planejados?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      automacoes_massa_destinatarios: {
        Row: {
          automacao_id: string
          cliente_id: string | null
          created_at: string
          data_envio: string | null
          enviar: boolean | null
          erro_mensagem: string | null
          id: string
          mensagem_personalizada: string | null
          nome_destinatario: string | null
          numero_whatsapp: string
          status_envio: string | null
          tempo_espera_segundos: number | null
        }
        Insert: {
          automacao_id: string
          cliente_id?: string | null
          created_at?: string
          data_envio?: string | null
          enviar?: boolean | null
          erro_mensagem?: string | null
          id?: string
          mensagem_personalizada?: string | null
          nome_destinatario?: string | null
          numero_whatsapp: string
          status_envio?: string | null
          tempo_espera_segundos?: number | null
        }
        Update: {
          automacao_id?: string
          cliente_id?: string | null
          created_at?: string
          data_envio?: string | null
          enviar?: boolean | null
          erro_mensagem?: string | null
          id?: string
          mensagem_personalizada?: string | null
          nome_destinatario?: string | null
          numero_whatsapp?: string
          status_envio?: string | null
          tempo_espera_segundos?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'automacoes_massa_destinatarios_automacao_id_fkey'
            columns: ['automacao_id']
            isOneToOne: false
            referencedRelation: 'automacoes_massa'
            referencedColumns: ['id']
          },
        ]
      }
      calls: {
        Row: {
          created_at: string
          csat_comentario: string | null
          csat_data_resposta: string | null
          csat_enviado: boolean | null
          csat_nota: number | null
          csat_respondido: boolean | null
          data_agendada: string | null
          data_realizada: string | null
          duracao_minutos: number | null
          id: string
          numero_call: number
          produto_cliente_id: string
          transcricao: string | null
          transcricao_filename: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          csat_comentario?: string | null
          csat_data_resposta?: string | null
          csat_enviado?: boolean | null
          csat_nota?: number | null
          csat_respondido?: boolean | null
          data_agendada?: string | null
          data_realizada?: string | null
          duracao_minutos?: number | null
          id?: string
          numero_call: number
          produto_cliente_id: string
          transcricao?: string | null
          transcricao_filename?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          csat_comentario?: string | null
          csat_data_resposta?: string | null
          csat_enviado?: boolean | null
          csat_nota?: number | null
          csat_respondido?: boolean | null
          data_agendada?: string | null
          data_realizada?: string | null
          duracao_minutos?: number | null
          id?: string
          numero_call?: number
          produto_cliente_id?: string
          transcricao?: string | null
          transcricao_filename?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'calls_produto_cliente_id_fkey'
            columns: ['produto_cliente_id']
            isOneToOne: false
            referencedRelation: 'produtos_cliente'
            referencedColumns: ['id']
          },
        ]
      }
      clientes: {
        Row: {
          created_at: string
          data_inicio_consultoria: string | null
          dor_principal: string | null
          email: string | null
          id: string
          nivel_engajamento: string | null
          nome_completo: string
          observacoes: string | null
          pendente_classificacao: boolean | null
          potencial_upsell: boolean | null
          primeiro_nome: string | null
          reembolsado: boolean | null
          segmento: string | null
          sobrenome: string | null
          telefone: string
          updated_at: string
          whatsapp_number: string | null
        }
        Insert: {
          created_at?: string
          data_inicio_consultoria?: string | null
          dor_principal?: string | null
          email?: string | null
          id?: string
          nivel_engajamento?: string | null
          nome_completo: string
          observacoes?: string | null
          pendente_classificacao?: boolean | null
          potencial_upsell?: boolean | null
          primeiro_nome?: string | null
          reembolsado?: boolean | null
          segmento?: string | null
          sobrenome?: string | null
          telefone: string
          updated_at?: string
          whatsapp_number?: string | null
        }
        Update: {
          created_at?: string
          data_inicio_consultoria?: string | null
          dor_principal?: string | null
          email?: string | null
          id?: string
          nivel_engajamento?: string | null
          nome_completo?: string
          observacoes?: string | null
          pendente_classificacao?: boolean | null
          potencial_upsell?: boolean | null
          primeiro_nome?: string | null
          reembolsado?: boolean | null
          segmento?: string | null
          sobrenome?: string | null
          telefone?: string
          updated_at?: string
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      configuracoes: {
        Row: {
          chave: string
          id: string
          tipo: string | null
          updated_at: string
          valor: string | null
        }
        Insert: {
          chave: string
          id?: string
          tipo?: string | null
          updated_at?: string
          valor?: string | null
        }
        Update: {
          chave?: string
          id?: string
          tipo?: string | null
          updated_at?: string
          valor?: string | null
        }
        Relationships: []
      }
      contexto_geral: {
        Row: {
          conteudo: string
          id: string
          secao: string
          updated_at: string
        }
        Insert: {
          conteudo: string
          id?: string
          secao: string
          updated_at?: string
        }
        Update: {
          conteudo?: string
          id?: string
          secao?: string
          updated_at?: string
        }
        Relationships: []
      }
      conversas_whatsapp: {
        Row: {
          cliente_id: string | null
          created_at: string
          id: string
          mensagens_nao_lidas: number | null
          numero_whatsapp: string
          prioridade: string | null
          ultima_interacao: string | null
          ultima_mensagem: string | null
          ultima_mensagem_timestamp: string | null
          updated_at: string
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string
          id?: string
          mensagens_nao_lidas?: number | null
          numero_whatsapp: string
          prioridade?: string | null
          ultima_interacao?: string | null
          ultima_mensagem?: string | null
          ultima_mensagem_timestamp?: string | null
          updated_at?: string
        }
        Update: {
          cliente_id?: string | null
          created_at?: string
          id?: string
          mensagens_nao_lidas?: number | null
          numero_whatsapp?: string
          prioridade?: string | null
          ultima_interacao?: string | null
          ultima_mensagem?: string | null
          ultima_mensagem_timestamp?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'conversas_whatsapp_cliente_id_fkey'
            columns: ['cliente_id']
            isOneToOne: false
            referencedRelation: 'clientes'
            referencedColumns: ['id']
          },
        ]
      }
      mensagens: {
        Row: {
          conteudo: string
          conversa_id: string
          created_at: string
          enviado_via: string | null
          id: string
          status_leitura: boolean | null
          timestamp: string | null
          tipo: string
        }
        Insert: {
          conteudo: string
          conversa_id: string
          created_at?: string
          enviado_via?: string | null
          id?: string
          status_leitura?: boolean | null
          timestamp?: string | null
          tipo: string
        }
        Update: {
          conteudo?: string
          conversa_id?: string
          created_at?: string
          enviado_via?: string | null
          id?: string
          status_leitura?: boolean | null
          timestamp?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: 'mensagens_conversa_id_fkey'
            columns: ['conversa_id']
            isOneToOne: false
            referencedRelation: 'conversas_whatsapp'
            referencedColumns: ['id']
          },
        ]
      }
      produtos_cliente: {
        Row: {
          cliente_id: string
          created_at: string
          data_1_call: string | null
          data_10_call: string | null
          data_11_call: string | null
          data_12_call: string | null
          data_2_call: string | null
          data_3_call: string | null
          data_4_call: string | null
          data_5_call: string | null
          data_6_call: string | null
          data_7_call: string | null
          data_8_call: string | null
          data_9_call: string | null
          data_fim_prevista: string | null
          data_inicio: string | null
          id: string
          num_calls_realizadas: number | null
          num_calls_total: number | null
          observacoes_produto: string | null
          produto: string
          status: string
          updated_at: string
        }
        Insert: {
          cliente_id: string
          created_at?: string
          data_1_call?: string | null
          data_10_call?: string | null
          data_11_call?: string | null
          data_12_call?: string | null
          data_2_call?: string | null
          data_3_call?: string | null
          data_4_call?: string | null
          data_5_call?: string | null
          data_6_call?: string | null
          data_7_call?: string | null
          data_8_call?: string | null
          data_9_call?: string | null
          data_fim_prevista?: string | null
          data_inicio?: string | null
          id?: string
          num_calls_realizadas?: number | null
          num_calls_total?: number | null
          observacoes_produto?: string | null
          produto: string
          status: string
          updated_at?: string
        }
        Update: {
          cliente_id?: string
          created_at?: string
          data_1_call?: string | null
          data_10_call?: string | null
          data_11_call?: string | null
          data_12_call?: string | null
          data_2_call?: string | null
          data_3_call?: string | null
          data_4_call?: string | null
          data_5_call?: string | null
          data_6_call?: string | null
          data_7_call?: string | null
          data_8_call?: string | null
          data_9_call?: string | null
          data_fim_prevista?: string | null
          data_inicio?: string | null
          id?: string
          num_calls_realizadas?: number | null
          num_calls_total?: number | null
          observacoes_produto?: string | null
          produto?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'produtos_cliente_cliente_id_fkey'
            columns: ['cliente_id']
            isOneToOne: false
            referencedRelation: 'clientes'
            referencedColumns: ['id']
          },
        ]
      }
      tags_cliente: {
        Row: {
          ativo: boolean | null
          cliente_id: string
          created_at: string
          data_referencia: string | null
          dias_contagem: number | null
          id: string
          produto_cliente_id: string | null
          tipo_tag: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean | null
          cliente_id: string
          created_at?: string
          data_referencia?: string | null
          dias_contagem?: number | null
          id?: string
          produto_cliente_id?: string | null
          tipo_tag: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean | null
          cliente_id?: string
          created_at?: string
          data_referencia?: string | null
          dias_contagem?: number | null
          id?: string
          produto_cliente_id?: string | null
          tipo_tag?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'tags_cliente_cliente_id_fkey'
            columns: ['cliente_id']
            isOneToOne: false
            referencedRelation: 'clientes'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'tags_cliente_produto_cliente_id_fkey'
            columns: ['produto_cliente_id']
            isOneToOne: false
            referencedRelation: 'produtos_cliente'
            referencedColumns: ['id']
          },
        ]
      }
      templates_resposta: {
        Row: {
          atalho: string | null
          ativo: boolean | null
          categoria: string | null
          conteudo: string
          created_at: string
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          atalho?: string | null
          ativo?: boolean | null
          categoria?: string | null
          conteudo: string
          created_at?: string
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          atalho?: string | null
          ativo?: boolean | null
          categoria?: string | null
          conteudo?: string
          created_at?: string
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      timeline_eventos: {
        Row: {
          cliente_id: string
          created_at: string
          data_evento: string | null
          data_resolucao: string | null
          descricao: string
          id: string
          produto_cliente_id: string | null
          resolvido: boolean | null
          tipo_evento: string
        }
        Insert: {
          cliente_id: string
          created_at?: string
          data_evento?: string | null
          data_resolucao?: string | null
          descricao: string
          id?: string
          produto_cliente_id?: string | null
          resolvido?: boolean | null
          tipo_evento: string
        }
        Update: {
          cliente_id?: string
          created_at?: string
          data_evento?: string | null
          data_resolucao?: string | null
          descricao?: string
          id?: string
          produto_cliente_id?: string | null
          resolvido?: boolean | null
          tipo_evento?: string
        }
        Relationships: [
          {
            foreignKeyName: 'timeline_eventos_cliente_id_fkey'
            columns: ['cliente_id']
            isOneToOne: false
            referencedRelation: 'clientes'
            referencedColumns: ['id']
          },
        ]
      }
      vendas: {
        Row: {
          cliente_id: string
          created_at: string
          data_criacao: string | null
          data_fechamento: string | null
          data_fup_agendado: string | null
          id: string
          observacoes_venda: string | null
          origem_lead: string | null
          probabilidade_fechamento: number | null
          produto_customizado: string | null
          produto_interesse: string | null
          status_venda: string
          updated_at: string
          valor_estimado: number | null
          valor_fechado: number | null
        }
        Insert: {
          cliente_id: string
          created_at?: string
          data_criacao?: string | null
          data_fechamento?: string | null
          data_fup_agendado?: string | null
          id?: string
          observacoes_venda?: string | null
          origem_lead?: string | null
          probabilidade_fechamento?: number | null
          produto_customizado?: string | null
          produto_interesse?: string | null
          status_venda: string
          updated_at?: string
          valor_estimado?: number | null
          valor_fechado?: number | null
        }
        Update: {
          cliente_id?: string
          created_at?: string
          data_criacao?: string | null
          data_fechamento?: string | null
          data_fup_agendado?: string | null
          id?: string
          observacoes_venda?: string | null
          origem_lead?: string | null
          probabilidade_fechamento?: number | null
          produto_customizado?: string | null
          produto_interesse?: string | null
          status_venda?: string
          updated_at?: string
          valor_estimado?: number | null
          valor_fechado?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'vendas_cliente_id_fkey'
            columns: ['cliente_id']
            isOneToOne: false
            referencedRelation: 'clientes'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
