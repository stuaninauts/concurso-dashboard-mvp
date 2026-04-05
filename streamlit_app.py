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

# --- Sidebar: Configuração e Carga ---
with st.sidebar:
    st.header("📂 Fonte de Dados")
    uploaded_file = st.file_uploader("Upload CSV", type=["csv"])
    sheet_url = st.text_input("Link Sheets", placeholder="https://docs.google.com/...")
    st.divider()

# Carga de Dados
with st.spinner("Carregando..."):
    df_raw = load_data(sheet_url=sheet_url, uploaded_file=uploaded_file)

if df_raw.empty:
    st.warning("👈 Carregue os dados para começar.")
    st.stop()

# Garantir data
if 'data' in df_raw.columns:
    df_raw['data'] = pd.to_datetime(df_raw['data'])

# --- Sidebar: Filtros ---
with st.sidebar:
    st.header("🔍 Filtros")
    
    # 1. Data
    min_date = df_raw['data'].min()
    max_date = df_raw['data'].max()
    d_inicial, d_final = st.date_input("Período", (min_date, max_date), min_value=min_date, max_value=max_date)

    # 2. Categóricos
    bancas = df_raw['concurso'].unique().tolist() if 'concurso' in df_raw.columns else []
    sel_banca = st.multiselect("Banca", bancas, default=bancas)
    
    materias = df_raw['materia'].unique().tolist() if 'materia' in df_raw.columns else []
    sel_materia = st.multiselect("Matéria", materias, default=materias)

    st.divider()
    
    # 3. Filtro de Tipo de Erro (Novo)
    st.markdown("**Filtrar Visualização de Erros**")
    tipos_erro_disponiveis = ['erro_nao_estudei', 'erro_nao_sabia', 'erro_interpretacao', 'erro_desatencao']
    sel_tipos_erro = st.multiselect("Exibir Apenas Erros de:", options=tipos_erro_disponiveis, default=tipos_erro_disponiveis, format_func=lambda x: x.replace('erro_', '').replace('_', ' ').title())

# --- Filtragem do DataFrame ---
df = df_raw.copy()
df = df[(df['data'].dt.date >= d_inicial) & (df['data'].dt.date <= d_final)]
if sel_banca: df = df[df['concurso'].isin(sel_banca)]
if sel_materia: df = df[df['materia'].isin(sel_materia)]

if df.empty:
    st.warning("Sem dados para os filtros selecionados.")
    st.stop()

# --- Cálculos de Métricas ---
if 'peso' not in df.columns:
    df['peso'] = 1.0
df['peso'] = df['peso'].fillna(1.0)

total_questoes = df['questoes'].sum()
total_acertos = df['acertos'].sum()
total_nao_estudei = df['erro_nao_estudei'].sum()

# Valores Ponderados
df['pontos_max'] = df['questoes'] * df['peso']
df['pontos_acertos'] = df['acertos'] * df['peso']
df['pontos_nao_estudei'] = df['erro_nao_estudei'] * df['peso']

total_pontos_max = df['pontos_max'].sum()
total_pontos_acertos = df['pontos_acertos'].sum()
total_pontos_nao_estudei = df['pontos_nao_estudei'].sum()

# Taxa Bruta (considera tudo, não ponderada)
taxa_bruta = (total_acertos / total_questoes * 100) if total_questoes > 0 else 0

# Taxa Líquida / Real (não ponderada)
questoes_validas = total_questoes - total_nao_estudei
taxa_real = (total_acertos / questoes_validas * 100) if questoes_validas > 0 else 0

# Taxa de Pontos (ponderada)
taxa_pontos = (total_pontos_acertos / total_pontos_max * 100) if total_pontos_max > 0 else 0

# --- Dashboard: KPIs ---
st.title("📊 Monitoramento de Desempenho")

k1, k2, k3, k4, k5, k6 = st.columns(6)
k1.metric("Questões Totais", int(total_questoes))
k2.metric("Acertos", int(total_acertos))
k3.metric("Taxa Bruta", f"{taxa_bruta:.1f}%", help="Acertos / Todas as Questões")
k4.metric("Taxa Real (Líquida)", f"{taxa_real:.1f}%", delta=f"{taxa_real-taxa_bruta:.1f}%", help="Acertos / (Todas - Não Estudei)")
k5.metric("Não Estudei", int(total_nao_estudei))
k6.metric("Taxa de Pontos", f"{taxa_pontos:.1f}%", help="Desempenho com base nos pesos das matérias (Pontos Obtidos / Pontos Totais)")

st.divider()

# --- Abas ---
tab1, tab2, tab3 = st.tabs(["📈 Evolução & Matérias", "⚠️ Análise de Erros", "🚨 Assuntos Críticos"])

# TAB 1: Evolução
with tab1:
    c1, c2 = st.columns([2, 1])
    with c1:
        st.subheader("Evolução Temporal")
        # Agrupamento diário
        df_tempo = df.groupby('data')[['questoes', 'acertos', 'erro_nao_estudei', 'pontos_max', 'pontos_acertos']].sum().reset_index()
        
        # Calculando as taxas na linha do tempo
        df_tempo['Bruta'] = (df_tempo['acertos'] / df_tempo['questoes'] * 100).fillna(0)
        df_tempo['Real'] = df_tempo.apply(lambda x: (x['acertos'] / (x['questoes'] - x['erro_nao_estudei']) * 100) if (x['questoes'] - x['erro_nao_estudei']) > 0 else 0, axis=1)
        df_tempo['Pontos'] = (df_tempo['pontos_acertos'] / df_tempo['pontos_max'] * 100).fillna(0)

        fig = go.Figure()
        fig.add_trace(go.Scatter(x=df_tempo['data'], y=df_tempo['Bruta'], name='Taxa Bruta', line=dict(dash='dot', color='gray')))
        fig.add_trace(go.Scatter(x=df_tempo['data'], y=df_tempo['Real'], name='Taxa Real (Sabe)', line=dict(color='blue', width=3)))
        fig.add_trace(go.Scatter(x=df_tempo['data'], y=df_tempo['Pontos'], name='Taxa de Pontos', line=dict(color='orange', width=2)))
        fig.update_layout(title="Comparativo: Taxa Bruta vs Real vs Pontos", yaxis_range=[0, 110], hovermode="x unified")
        st.plotly_chart(fig, use_container_width=True)

    with c2:
        st.subheader("Ranking por Matéria (Taxa Real)")
        df_mat = df.groupby('materia')[['questoes', 'acertos', 'erro_nao_estudei']].sum().reset_index()
        # Calcula Taxa Real por matéria
        df_mat['Taxa Real'] = df_mat.apply(lambda x: (x['acertos'] / (x['questoes'] - x['erro_nao_estudei']) * 100) if (x['questoes'] - x['erro_nao_estudei']) > 0 else 0, axis=1)
        df_mat = df_mat.sort_values('Taxa Real')

        fig_bar = px.bar(df_mat, x='Taxa Real', y='materia', orientation='h', text_auto='.1f', color='Taxa Real', color_continuous_scale='RdYlGn')
        fig_bar.update_layout(xaxis_range=[0, 100])
        st.plotly_chart(fig_bar, use_container_width=True)

# TAB 2: Erros
with tab2:
    st.subheader("Distribuição dos Tipos de Erro")
    
    # Filtra colunas baseado na seleção da sidebar
    if not sel_tipos_erro:
        st.warning("Selecione pelo menos um tipo de erro na barra lateral.")
    else:
        # Soma total dos erros selecionados
        erros_filtrados = df[sel_tipos_erro].sum().reset_index()
        erros_filtrados.columns = ['Tipo', 'Qtd']
        
        col_pie, col_heat = st.columns([1, 2])
        
        with col_pie:
            if erros_filtrados['Qtd'].sum() > 0:
                # Limpa nomes para o gráfico
                erros_filtrados['Label'] = erros_filtrados['Tipo'].str.replace('erro_', '').str.replace('_', ' ').str.title()
                fig_pie = px.pie(erros_filtrados, values='Qtd', names='Label', hole=0.4, title="Proporção dos Erros Selecionados")
                st.plotly_chart(fig_pie, use_container_width=True)
            else:
                st.info("Nenhum erro desse tipo registrado.")

        with col_heat:
            # Heatmap cruzando Matéria x Tipos Selecionados
            heatmap_data = df.groupby('materia')[sel_tipos_erro].sum()
            # Renomear colunas para ficar bonito
            heatmap_data.columns = [c.replace('erro_', '').replace('_', ' ').title() for c in heatmap_data.columns]
            
            fig_heat = px.imshow(heatmap_data, text_auto=True, color_continuous_scale='Reds', aspect="auto", title="Mapa de Calor: Onde os erros acontecem")
            st.plotly_chart(fig_heat, use_container_width=True)

# TAB 3: Assuntos Específicos (Nuvem de Erros)
with tab3:
    st.subheader("Análise Detalhada dos Assuntos de Erro")
    
    if 'assuntos_erro' in df.columns:
        # Prepara lista de assuntos
        df_exploded = df[df['assuntos_erro'].str.len() > 1].copy()
        
        if not df_exploded.empty:
            # Explode a lista separada por vírgula
            # 1. Split da string -> Lista
            # 2. Explode lista -> Linhas
            # 3. Strip -> Remove espaços em branco das pontas
            todos_erros = df_exploded['assuntos_erro'].str.split(',').explode().str.strip()
            
            # Conta frequência e remove vazios
            contagem = todos_erros.value_counts().reset_index()
            contagem.columns = ['Assunto Específico', 'Ocorrências']
            contagem = contagem[contagem['Assunto Específico'] != '']
            
            c1, c2 = st.columns([2, 1])
            with c1:
                fig_tree = px.treemap(contagem.head(30), path=['Assunto Específico'], values='Ocorrências', color='Ocorrências', color_continuous_scale='Reds', title="Treemap: Assuntos com Mais Erros")
                st.plotly_chart(fig_tree, use_container_width=True)
            
            with c2:
                st.write("Top 10 Assuntos Recorrentes")
                st.dataframe(contagem.head(10).style.background_gradient(cmap='Reds'), use_container_width=True)
        else:
            st.info("Nenhum assunto de erro detalhado encontrado.")

# Footer
with st.expander("Ver Dados Brutos"):
    st.dataframe(df.sort_values('data', ascending=False), use_container_width=True)
