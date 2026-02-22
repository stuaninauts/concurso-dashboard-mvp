import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from data_loader import load_data

st.set_page_config(page_title="Dashboard Concursos", page_icon="🎯", layout="wide")

# CSS para métricas grandes
st.markdown("""
<style>
    [data-testid="stMetricValue"] {font-size: 24px;}
</style>
""", unsafe_allow_html=True)

# --- Sidebar ---
with st.sidebar:
    st.header("📂 Fonte de Dados")
    uploaded_file = st.file_uploader("Upload CSV", type=["csv"])
    sheet_url = st.text_input("Link do Google Sheets", placeholder="https://docs.google.com/...")
    
    st.divider()

with st.spinner("Carregando dados..."):
    df_raw = load_data(sheet_url=sheet_url, uploaded_file=uploaded_file)

if df_raw.empty:
    st.warning("👈 Carregue os dados para começar.")
    st.stop()

# --- Filtros ---
with st.sidebar:
    st.header("🔍 Filtros")
    df_raw['data'] = pd.to_datetime(df_raw['data'])
    
    min_date = df_raw['data'].min()
    max_date = df_raw['data'].max()
    
    data_inicial, data_final = st.date_input("Período", value=(min_date, max_date), min_value=min_date, max_value=max_date)

    opcoes_banca = df_raw['concurso'].unique().tolist() if 'concurso' in df_raw.columns else []
    filtro_banca = st.multiselect("Banca", options=opcoes_banca, default=opcoes_banca)
    
    opcoes_materia = df_raw['materia'].unique().tolist() if 'materia' in df_raw.columns else []
    filtro_materia = st.multiselect("Matéria", options=opcoes_materia, default=opcoes_materia)

# Aplicação Filtros
df = df_raw.copy()
df = df[(df['data'].dt.date >= data_inicial) & (df['data'].dt.date <= data_final)]
if filtro_banca: df = df[df['concurso'].isin(filtro_banca)]
if filtro_materia: df = df[df['materia'].isin(filtro_materia)]

# --- KPIs ---
st.title("📊 Monitoramento de Desempenho")

kpi1, kpi2, kpi3, kpi4 = st.columns(4)
total_questoes = df['questoes'].sum()
total_acertos = df['acertos'].sum()
taxa_geral = (total_acertos / total_questoes * 100) if total_questoes > 0 else 0

kpi1.metric("Questões", int(total_questoes))
kpi2.metric("Acertos", int(total_acertos))
kpi3.metric("Taxa Geral", f"{taxa_geral:.1f}%")
kpi4.metric("Registros", len(df))

st.divider()

if df.empty:
    st.warning("Sem dados para os filtros atuais.")
    st.stop()

# --- Abas de Análise ---
tab1, tab2, tab3 = st.tabs(["📈 Evolução", "⚠️ Tipos de Erro", "🚨 Top Assuntos Errados"])

# TAB 1: Evolução
with tab1:
    col_a, col_b = st.columns([2, 1])
    with col_a:
        df_tempo = df.groupby('data')[['questoes', 'acertos']].sum().reset_index()
        df_tempo['Taxa'] = (df_tempo['acertos'] / df_tempo['questoes'] * 100)
        
        fig = px.line(df_tempo, x='data', y='Taxa', markers=True, title="Evolução da Taxa de Acerto (%)")
        fig.update_yaxes(range=[0, 110])
        st.plotly_chart(fig, use_container_width=True)
    
    with col_b:
        df_mat = df.groupby('materia')[['questoes', 'acertos']].sum().reset_index()
        df_mat['Taxa'] = (df_mat['acertos'] / df_mat['questoes'] * 100)
        df_mat = df_mat.sort_values('Taxa')
        
        fig_bar = px.bar(df_mat, x='Taxa', y='materia', orientation='h', title="Ranking por Matéria", color='Taxa', color_continuous_scale='RdYlGn')
        st.plotly_chart(fig_bar, use_container_width=True)

# TAB 2: Tipos de Erro
with tab2:
    cols_erro = ['erro_nao_estudei', 'erro_nao_sabia', 'erro_interpretacao', 'erro_desatencao']
    if set(cols_erro).issubset(df.columns):
        erros_totais = df[cols_erro].sum().reset_index()
        erros_totais.columns = ['Tipo', 'Qtd']
        
        c1, c2 = st.columns(2)
        c1.plotly_chart(px.pie(erros_totais, values='Qtd', names='Tipo', hole=0.4, title="Distribuição de Erros"), use_container_width=True)
        
        heatmap_data = df.groupby('materia')[cols_erro].sum()
        c2.plotly_chart(px.imshow(heatmap_data, text_auto=True, color_continuous_scale='Reds', title="Erros por Matéria"), use_container_width=True)

# TAB 3: Nuvem de Assuntos Errados (NOVA LÓGICA)
with tab3:
    st.subheader("Quais assuntos específicos mais derrubam a nota?")
    st.caption("Contagem baseada na coluna 'Erro: Assuntos' (separados por vírgula).")

    if 'assuntos_erro' in df.columns:
        # Lógica para explodir a lista de assuntos
        # 1. Filtra linhas que têm algo escrito
        df_erros = df[df['assuntos_erro'].str.len() > 2].copy()
        
        if not df_erros.empty:
            # 2. Separa por vírgula e cria uma lista
            # O stack() transforma as colunas em linhas
            todos_assuntos = df_erros['assuntos_erro'].str.split(',').explode().str.strip()
            
            # 3. Conta frequência
            contagem = todos_assuntos.value_counts().reset_index()
            contagem.columns = ['Assunto Específico', 'Ocorrências']
            
            # 4. Remove vazios caso existam
            contagem = contagem[contagem['Assunto Específico'] != '']
            
            # Visualização
            col_chart, col_table = st.columns([2, 1])
            
            with col_chart:
                fig_treemap = px.treemap(
                    contagem.head(20), # Top 20 
                    path=['Assunto Específico'], 
                    values='Ocorrências',
                    title="Top Assuntos Recorrentes nos Erros",
                    color='Ocorrências',
                    color_continuous_scale='Reds'
                )
                st.plotly_chart(fig_treemap, use_container_width=True)
            
            with col_table:
                st.dataframe(
                    contagem.style.background_gradient(cmap='Reds'),
                    use_container_width=True,
                    height=400
                )
        else:
            st.info("Nenhum assunto de erro detalhado encontrado nos registros.")
    else:
        st.error("Coluna 'Erro: Assuntos' não encontrada.")

# Footer
with st.expander("Ver Base de Dados Completa"):
    st.dataframe(df, use_container_width=True)
