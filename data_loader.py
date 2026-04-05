import pandas as pd
import streamlit as st
from streamlit_gsheets import GSheetsConnection

def load_data(sheet_url=None, uploaded_file=None):
    df = pd.DataFrame()
    
    # 1. CSV
    if uploaded_file is not None:
        try:
            df = pd.read_csv(uploaded_file)
            st.toast("Dados via CSV!", icon="✅")
            return _clean_data(df)
        except Exception as e:
            st.error(f"Erro ao ler CSV: {e}")
            return pd.DataFrame()

    # 2. Sheets
    if sheet_url:
        try:
            conn = st.connection("gsheets", type=GSheetsConnection)
            df = conn.read(spreadsheet=sheet_url, ttl="2m", usecols=None)
            
            if df.empty:
                st.warning("Planilha vazia.")
                return df
            
            st.toast("Conectado ao Sheets!", icon="☁️")
            return _clean_data(df)

        except Exception as e:
            st.error(f"Erro no Google Sheets: {e}")
            return pd.DataFrame()

    return df

def _clean_data(df):
    if df.empty: 
        return df

    # Normalizar headers
    df.columns = [str(c).strip().lower() for c in df.columns]

    rename_map = {
        'data': 'data',
        'concurso': 'concurso',
        'materia': 'materia', 
        'matéria': 'materia',
        # NOVA LÓGICA: Assuntos de Erro
        'erro: assuntos': 'assuntos_erro',
        'assuntos': 'assuntos_erro',
        'erro: assunto': 'assuntos_erro',
        # Métricas
        'questões': 'questoes',
        'questoes': 'questoes',
        'acertos': 'acertos',
        'erro: não estudei': 'erro_nao_estudei',
        'erro: nao estudei': 'erro_nao_estudei',
        'erro: não sabia': 'erro_nao_sabia',
        'erro: nao sabia': 'erro_nao_sabia',
        'erro: interpretação': 'erro_interpretacao',
        'erro: interpretacao': 'erro_interpretacao',
        'erro: desatenção': 'erro_desatencao',
        'erro: desatencao': 'erro_desatencao',
        'tempo': 'tempo_min',
        'peso': 'peso'
    }
    
    df = df.rename(columns=rename_map)

    # --- Tratamento de Tipos ---
    
    # Data
    if 'data' in df.columns:
        df['data'] = pd.to_datetime(df['data'], dayfirst=True, errors='coerce')
    
    # Texto (Garantir que assuntos_erro seja string para o split funcionar depois)
    if 'assuntos_erro' in df.columns:
        df['assuntos_erro'] = df['assuntos_erro'].astype(str).replace('nan', '')

    # Numéricos
    cols_num = ['questoes', 'acertos', 'erro_nao_estudei', 'erro_nao_sabia', 
                'erro_interpretacao', 'erro_desatencao', 'tempo_min', 'peso']
    
    for col in cols_num:
        if col in df.columns:
            if col == 'peso':
                df[col] = pd.to_numeric(df[col], errors='coerce').fillna(1.0)
            else:
                df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)

    # Taxa
    if 'acertos' in df.columns and 'questoes' in df.columns:
         df['taxa_acerto'] = df.apply(
             lambda row: (row['acertos'] / row['questoes'] * 100) if row['questoes'] > 0 else 0, 
             axis=1
         )

    return df