"""
Bittensor Alpha Holders Dashboard
Comprehensive analysis of alpha token holders
"""

import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import json
from typing import Dict, List

# ═══════════════════════════════════════════════════════════════════
# COLOR PALETTES - Custom Red/Violet Theme
# ═══════════════════════════════════════════════════════════════════

# Palette principale du frontend
BRAND_COLORS = {
    'primary_blue': '#282AE6',      # Bleu principal
    'light_violet': '#C7A4FF',      # Violet clair
    'dark_violet': '#212278',       # Violet foncé
    'sky_blue': '#62B0FF',          # Bleu ciel
    'red_orange': '#FF502E',        # Rouge/orange
    'light_gray_violet': '#B2B2CB', # Gris-violet clair
    'medium_gray_violet': '#7F7FA9',# Gris-violet moyen
    'very_light_blue': '#E3F1FF',   # Bleu très clair
    'very_light_violet': '#F9F5FF'  # Violet très clair
}

COLOR_PALETTES = {
    # Token count categories - Dégradé bleu/violet
    'token_count': {
        '1 token': '#FF502E',      # Rouge-orange (accent)
        '2-5 tokens': '#62B0FF',   # Bleu ciel
        '6-10 tokens': '#C7A4FF',  # Violet clair
        '10+ tokens': '#282AE6'    # Bleu principal
    },
    # Alpha percentage categories - Gradient rouge → violet
    'alpha_percentage': {
        '0-25%': '#B2B2CB',        # Gris-violet (faible)
        '25-50%': '#FF502E',       # Rouge-orange
        '50-95%': '#62B0FF',       # Bleu ciel
        '95-100%': '#282AE6'       # Bleu principal (très fort)
    },
    # Wallet value categories - Gradient clair → foncé
    'wallet_value': {
        '< 10 TAO': '#F9F5FF',     # Violet très clair
        '10-100 TAO': '#E3F1FF',   # Bleu très clair
        '100-1K TAO': '#62B0FF',   # Bleu ciel
        '1K-10K TAO': '#C7A4FF',   # Violet clair
        '10K+ TAO': '#FF502E'      # Rouge-orange (accent)
    },
    # Transaction categories - Gradient progressif
    'tx_count': {
        '0 tx': '#F9F5FF',         # Violet très clair
        '1-10 tx': '#E3F1FF',      # Bleu très clair
        '10-50 tx': '#62B0FF',     # Bleu ciel
        '50-100 tx': '#C7A4FF',    # Violet clair
        '100+ tx': '#FF502E'       # Rouge-orange (très actif)
    }
}

# Configuration de la page
st.set_page_config(
    page_title="Bittensor Alpha Holders Analysis",
    page_icon="🔗",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Style CSS personnalisé - Thème Rouge/Violet
st.markdown("""
<style>
    /* Import des polices Chillax et Sora */
    @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700;800&display=swap');
    
    /* Police globale */
    * {
        font-family: 'Sora', 'Segoe UI', sans-serif !important;
    }
    
    /* FOND PRINCIPAL - Dégradé rouge vers bleu clair */
    [data-testid="stAppViewContainer"] {
        background: linear-gradient(135deg, #FF502E 0%, #F54A45 15%, #E8445B 30%, #B85A9E 50%, #7B6EC8 70%, #4A8FFF 100%) !important;
        background-attachment: fixed !important;
    }
    
    /* HEADER BAR - Barre du haut avec bouton Deploy */
    [data-testid="stHeader"] {
        background: linear-gradient(90deg, #212278 0%, #4A1942 50%, #212278 100%) !important;
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
    }
    
    /* Bouton Deploy et autres boutons du header */
    [data-testid="stHeader"] button {
        color: #F9F5FF !important;
        border-color: #C7A4FF !important;
    }
    
    [data-testid="stHeader"] button:hover {
        background-color: rgba(199, 164, 255, 0.2) !important;
        border-color: #FF502E !important;
    }
    
    /* Overlay content */
    [data-testid="stAppViewContainer"] > .main {
        background: transparent !important;
    }
    
    .main .block-container {
        background: rgba(249, 245, 255, 0.95) !important;
        border-radius: 20px;
        padding: 2rem;
        box-shadow: 0 8px 32px rgba(40, 42, 230, 0.3);
        backdrop-filter: blur(15px);
        -webkit-backdrop-filter: blur(15px);
    }
    
    /* TITRES H1, H2, H3 - Couleurs du thème */
    h1, h2, h3 {
        color: #282AE6 !important;
        font-weight: 700 !important;
    }
    
    h1 {
        background: linear-gradient(135deg, #282AE6 0%, #C7A4FF 50%, #FF502E 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }
    
    h2 {
        color: #212278 !important;
        padding-bottom: 0.5rem;
    }
    
    h3 {
        color: #62B0FF !important;
        font-size: 1.5rem !important;
        font-weight: 600 !important;
    }
    
    /* Header principal personnalisé */
    .main-header {
        font-size: 4.5rem !important;
        font-weight: 900 !important;
        background: linear-gradient(135deg, #282AE6 0%, #C7A4FF 50%, #FF502E 100%) !important;
        -webkit-background-clip: text !important;
        -webkit-text-fill-color: transparent !important;
        background-clip: text !important;
        text-align: center !important;
        margin-bottom: 2rem !important;
        line-height: 1.2 !important;
        letter-spacing: -0.02em !important;
    }
    
    /* Section headers personnalisés */
    .section-header {
        font-size: 2.2rem !important;
        font-weight: 800 !important;
        color: #282AE6 !important;
        margin-top: 2rem !important;
        margin-bottom: 1.5rem !important;
        padding-bottom: 0.5rem !important;
        display: block !important;
    }
    
    /* Cards métriques */
    .metric-card {
        background: linear-gradient(135deg, #282AE6 0%, #212278 100%);
        padding: 1.5rem;
        border-radius: 15px;
        color: white;
        text-align: center;
        box-shadow: 0 4px 15px rgba(40, 42, 230, 0.3);
        border: 2px solid rgba(199, 164, 255, 0.3);
    }
    
    /* Métriques Streamlit natives */
    [data-testid="stMetric"] {
        background: rgba(255, 255, 255, 0.25) !important;
        padding: 1rem !important;
        border-radius: 12px !important;
        box-shadow: 0 4px 16px rgba(40, 42, 230, 0.15) !important;
        border: 1px solid rgba(199, 164, 255, 0.25) !important;
    }
    
    [data-testid="stMetricValue"] {
        color: #282AE6 !important;
        font-size: 2.5rem !important;
        font-weight: 800 !important;
    }
    
    [data-testid="stMetricLabel"] {
        color: #212278 !important;
        font-weight: 700 !important;
        font-size: 1rem !important;
    }
    
    [data-testid="stMetricDelta"] {
        color: #FF502E !important;
    }
    
    /* SIDEBAR - Dégradé violet */
    [data-testid="stSidebar"] {
        background: linear-gradient(180deg, #212278 0%, #4A1942 100%) !important;
    }
    
    [data-testid="stSidebar"] > div:first-child {
        background: linear-gradient(180deg, #212278 0%, #4A1942 100%) !important;
    }
    
    /* Texte sidebar */
    [data-testid="stSidebar"] * {
        color: #F9F5FF !important;
    }
    
    [data-testid="stSidebar"] h1,
    [data-testid="stSidebar"] h2,
    [data-testid="stSidebar"] h3 {
        color: #C7A4FF !important;
    }
    
    /* Labels sidebar */
    [data-testid="stSidebar"] label {
        color: #E3F1FF !important;
    }
    
    /* Widgets */
    .stSelectbox label, .stMultiSelect label {
        color: #212278 !important;
        font-weight: 600 !important;
    }
    
    /* Tabs */
    .stTabs [data-baseweb="tab-list"] {
        gap: 8px;
    }
    
    .stTabs [data-baseweb="tab"] {
        background-color: rgba(40, 42, 230, 0.1);
        border-radius: 8px;
        color: #282AE6;
        font-weight: 600;
    }
    
    .stTabs [aria-selected="true"] {
        background: linear-gradient(135deg, #282AE6 0%, #C7A4FF 100%) !important;
        color: white !important;
    }
    
    /* Expander (bouton déroulant filtres) */
    [data-testid="stExpander"] {
        background: rgba(255, 255, 255, 0.6) !important;
        border: 1px solid rgba(199, 164, 255, 0.4) !important;
        border-radius: 10px !important;
    }
    
    [data-testid="stExpander"] summary {
        background: rgba(40, 42, 230, 0.1) !important;
        color: #282AE6 !important;
        font-weight: 700 !important;
        padding: 0.8rem !important;
        border-radius: 8px !important;
    }
    
    [data-testid="stExpander"] summary:hover {
        background: rgba(199, 164, 255, 0.3) !important;
    }
    
    /* Conteneur des graphiques Plotly - Un seul cadre opaque */
    .stPlotlyChart {
        background: rgba(255, 255, 255, 0.25) !important;
        border-radius: 12px !important;
        padding: 0.5rem !important;
        box-shadow: 0 4px 16px rgba(40, 42, 230, 0.15) !important;
        border: 1px solid rgba(199, 164, 255, 0.25) !important;
    }
    
    /* Graphique Plotly lui-même - Transparent et bien ajusté */
    .js-plotly-plot {
        background: transparent !important;
    }
    
    .js-plotly-plot .plotly {
        width: 100% !important;
        height: 100% !important;
    }
    
    .js-plotly-plot .main-svg {
        width: 100% !important;
        height: 100% !important;
    }
    
    /* Hover effects */
    .metric-card:hover {
        transform: translateY(-5px);
        transition: all 0.3s ease;
        box-shadow: 0 8px 25px rgba(255, 80, 46, 0.4);
    }
    
    /* Markdown text */
    .stMarkdown {
        color: #212278 !important;
    }
    
    /* Supprimer traits oranges - HR tags */
    hr {
        border: none !important;
        border-top: 1px solid rgba(199, 164, 255, 0.3) !important;
        margin: 1rem 0 !important;
    }
</style>
""", unsafe_allow_html=True)

def apply_chart_theme(fig):
    """Apply custom theme to Plotly charts"""
    fig.update_layout(
        paper_bgcolor='rgba(0, 0, 0, 0)',  # Complètement transparent
        plot_bgcolor='rgba(0, 0, 0, 0)',   # Complètement transparent
        font=dict(
            family="'Sora', 'Segoe UI', sans-serif",
            size=13,
            color='#212278'
        ),
        title_font=dict(
            size=17,
            color='#282AE6',
            family="'Sora', 'Segoe UI', sans-serif"
        ),
        xaxis=dict(
            title_font=dict(size=14, color='#212278', family="'Sora', sans-serif", weight=700),
            tickfont=dict(size=12, color='#212278', family="'Sora', sans-serif", weight=600),
            gridcolor='rgba(33, 34, 120, 0.1)',
            linecolor='#212278',
            linewidth=2
        ),
        yaxis=dict(
            title_font=dict(size=14, color='#212278', family="'Sora', sans-serif", weight=700),
            tickfont=dict(size=12, color='#212278', family="'Sora', sans-serif", weight=600),
            gridcolor='rgba(33, 34, 120, 0.1)',
            linecolor='#212278',
            linewidth=2
        ),
        legend=dict(
            font=dict(size=12, color='#212278', family="'Sora', sans-serif", weight=600),
            bgcolor='rgba(0, 0, 0, 0)',
            bordercolor='rgba(0, 0, 0, 0)',
            borderwidth=0
        ),
        hoverlabel=dict(
            bgcolor='rgba(249, 245, 255, 0.95)',
            font_size=13,
            font_family="'Sora', 'Segoe UI', sans-serif",
            bordercolor='#C7A4FF'
        ),
        margin=dict(t=40, b=30, l=40, r=20),  # Marges réduites
        autosize=True  # Auto-ajustement
    )
    return fig

@st.cache_data
def load_data(file_path: str = 'output/alpha_holders_analysis.json') -> pd.DataFrame:
    """Charge et prépare les données"""
    with open(file_path, 'r') as f:
        data = json.load(f)
    
    df = pd.DataFrame(data)
    
    # Créer une colonne 'primary_role' pour faciliter l'analyse
    # Priorité: Subnet Owner > Validator > Miner > Investor
    def get_primary_role(roles):
        if 'Subnet Owner' in roles:
            return 'Subnet Owner'
        elif 'Validator' in roles:
            return 'Validator'
        elif 'Miner' in roles:
            return 'Miner'
        else:
            return 'Investor'
    
    df['primary_role'] = df['roles'].apply(get_primary_role)
    
    return df

def create_overview_metrics(df: pd.DataFrame):
    """Global metrics"""
    col1, col2, col3 = st.columns(3)
    
    with col1:
        st.metric(
            label="Total Coldkeys",
            value=f"{len(df):,}",
            help="Total number of coldkeys with > 0.1 TAO alpha"
        )
    
    with col2:
        total_alpha = df['total_alpha_value_tao'].sum()
        st.metric(
            label="Total Alpha (TAO)",
            value=f"{total_alpha:,.0f}",
            help="Total value of alpha tokens held"
        )
    
    with col3:
        avg_alpha_pct = df['alpha_percentage'].mean()
        st.metric(
            label="Average % Alpha",
            value=f"{avg_alpha_pct:.1f}%",
            help="Average percentage of alpha in wallets"
        )

def create_staking_proxy_analysis(df: pd.DataFrame):
    """Staking Proxy Analysis"""
    st.markdown('<p class="section-header">Staking Proxy Analysis</p>', unsafe_allow_html=True)
    
    # Calculer les statistiques
    with_proxy = df[df['has_staking_proxy'] == True]
    without_proxy = df[df['has_staking_proxy'] == False]
    
    total_wallets = len(df)
    proxy_count = len(with_proxy)
    proxy_pct = (proxy_count / total_wallets) * 100
    
    proxy_alpha_value = with_proxy['total_alpha_value_tao'].sum()
    total_alpha_value = df['total_alpha_value_tao'].sum()
    proxy_alpha_pct = (proxy_alpha_value / total_alpha_value) * 100
    
    # Métriques principales
    col1, col2, col3 = st.columns(3)
    
    with col1:
        st.metric(
            label="Wallets with Proxy",
            value=f"{proxy_count:,}",
            delta=f"{proxy_pct:.1f}% of total",
            help="Number of wallets using a staking proxy"
        )
    
    with col2:
        st.metric(
            label="Alpha Value in Proxy (TAO)",
            value=f"{proxy_alpha_value:,.0f}",
            delta=f"{proxy_alpha_pct:.1f}% of total",
            help="Total alpha value held in wallets with staking proxy"
        )
    
    with col3:
        avg_proxy_alpha = with_proxy['total_alpha_value_tao'].mean()
        avg_no_proxy_alpha = without_proxy['total_alpha_value_tao'].mean()
        st.metric(
            label="Avg Alpha per Proxy Wallet",
            value=f"{avg_proxy_alpha:,.0f} TAO",
            delta=f"{((avg_proxy_alpha / avg_no_proxy_alpha - 1) * 100):.1f}% vs no proxy" if len(without_proxy) > 0 else "N/A",
            help="Average alpha value in wallets with proxy vs without"
        )
    
    # Graphiques comparatifs
    col1, col2 = st.columns(2)
    
    with col1:
        # Pie chart: Distribution des wallets
        proxy_data = pd.DataFrame({
            'Status': ['With Proxy', 'Without Proxy'],
            'Count': [proxy_count, len(without_proxy)]
        })
        fig = px.pie(
            proxy_data,
            values='Count',
            names='Status',
            title='Wallet Distribution',
            hole=0.4,
            color='Status',
            color_discrete_map={
                'With Proxy': '#FF502E',
                'Without Proxy': '#62B0FF'
            }
        )
        fig.update_traces(textposition='inside', textinfo='percent+label')
        fig.update_layout(showlegend=False)
        fig = apply_chart_theme(fig)
        st.plotly_chart(fig, use_container_width=True)
    
    with col2:
        # Pie chart: Distribution de la valeur alpha
        value_data = pd.DataFrame({
            'Status': ['With Proxy', 'Without Proxy'],
            'Alpha Value': [proxy_alpha_value, total_alpha_value - proxy_alpha_value]
        })
        fig = px.pie(
            value_data,
            values='Alpha Value',
            names='Status',
            title='Alpha Value Distribution (TAO)',
            hole=0.4,
            color='Status',
            color_discrete_map={
                'With Proxy': '#FF502E',
                'Without Proxy': '#62B0FF'
            }
        )
        fig.update_traces(textposition='inside', textinfo='percent+label')
        fig.update_layout(showlegend=False)
        fig = apply_chart_theme(fig)
        st.plotly_chart(fig, use_container_width=True)

def create_category_overview(df: pd.DataFrame):
    """Category overview"""
    st.markdown('<p class="section-header">Distribution by Category</p>', unsafe_allow_html=True)
    
    # Compter par catégorie
    category_counts = df['primary_role'].value_counts().reset_index()
    category_counts.columns = ['Category', 'Number']
    
    # Valeur TAO par catégorie
    category_values = df.groupby('primary_role')['total_alpha_value_tao'].sum().reset_index()
    category_values.columns = ['Category', 'TAO Value']
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.markdown("### Number of Coldkeys by Category")
        fig = px.bar(
            category_counts,
            x='Category',
            y='Number',
            color='Category',
            text='Number',
            color_discrete_map={
                'Subnet Owner': '#FF502E',  # Rouge-orange
                'Validator': '#282AE6',     # Bleu principal
                'Miner': '#62B0FF',         # Bleu ciel
                'Investor': '#C7A4FF'       # Violet clair
            }
        )
        fig.update_traces(texttemplate='%{text:,}', textposition='auto')
        fig.update_layout(showlegend=False, height=450, title='')
        fig = apply_chart_theme(fig)
        st.plotly_chart(fig, use_container_width=True)
    
    with col2:
        st.markdown("### Alpha Value (TAO) by Category")
        fig = px.bar(
            category_values,
            x='Category',
            y='TAO Value',
            color='Category',
            text='TAO Value',
            color_discrete_map={
                'Subnet Owner': '#FF502E',  # Rouge-orange
                'Validator': '#282AE6',     # Bleu principal
                'Miner': '#62B0FF',         # Bleu ciel
                'Investor': '#C7A4FF'       # Violet clair
            }
        )
        fig.update_traces(texttemplate='%{text:,.0f}', textposition='auto')
        fig.update_layout(showlegend=False, height=450, title='')
        fig = apply_chart_theme(fig)
        st.plotly_chart(fig, use_container_width=True)

def categorize_token_count(count: int) -> str:
    """Categorize token count"""
    if count == 1:
        return '1 token'
    elif 2 <= count <= 5:
        return '2-5 tokens'
    elif 6 <= count <= 10:
        return '6-10 tokens'
    else:
        return '10+ tokens'

def categorize_alpha_percentage(pct: float) -> str:
    """Categorize alpha percentage"""
    if pct < 25:
        return '0-25%'
    elif pct < 50:
        return '25-50%'
    elif pct < 95:
        return '50-95%'
    else:
        return '95-100%'

def categorize_wallet_value(value: float) -> str:
    """Categorize wallet value"""
    if value < 10:
        return '< 10 TAO'
    elif value < 100:
        return '10-100 TAO'
    elif value < 1000:
        return '100-1K TAO'
    elif value < 10000:
        return '1K-10K TAO'
    else:
        return '10K+ TAO'

def categorize_tx_count(tx: int) -> str:
    """Categorize transaction count"""
    if tx == 0:
        return '0 tx'
    elif tx < 10:
        return '1-10 tx'
    elif tx < 50:
        return '10-50 tx'
    elif tx < 100:
        return '50-100 tx'
    else:
        return '100+ tx'

def create_distribution_charts(df: pd.DataFrame, category: str, title: str):
    """Create distribution charts for a category"""
    
    # Filter by category
    if category != 'All':
        df_cat = df[df['primary_role'] == category].copy()
    else:
        df_cat = df.copy()
    
    st.markdown(f'<p class="section-header">{title}</p>', unsafe_allow_html=True)
    
    # 1. Distribution by number of different tokens
    st.markdown("### Distribution by Number of Different Alpha Tokens")
    
    df_cat['token_category'] = df_cat['unique_alpha_tokens'].apply(categorize_token_count)
    
    # Category order
    token_order = ['1 token', '2-5 tokens', '6-10 tokens', '10+ tokens']
    
    col1, col2 = st.columns(2)
    
    with col1:
        # By number of coldkeys
        token_count = df_cat['token_category'].value_counts().reindex(token_order, fill_value=0)
        colors = [COLOR_PALETTES['token_count'][cat] for cat in token_count.index]
        fig = px.pie(
            values=token_count.values,
            names=token_count.index,
            title='% by Number of Coldkeys',
            hole=0.4,
            color=token_count.index,
            color_discrete_map=COLOR_PALETTES['token_count']
        )
        fig.update_traces(textposition='inside', textinfo='percent+label')
        fig.update_layout(showlegend=False)
        fig = apply_chart_theme(fig)
        st.plotly_chart(fig, use_container_width=True)
    
    with col2:
        # By TAO value
        token_value = df_cat.groupby('token_category')['total_alpha_value_tao'].sum().reindex(token_order, fill_value=0)
        fig = px.pie(
            values=token_value.values,
            names=token_value.index,
            title='% by TAO Value',
            hole=0.4,
            color=token_value.index,
            color_discrete_map=COLOR_PALETTES['token_count']
        )
        fig.update_traces(textposition='inside', textinfo='percent+label')
        fig.update_layout(showlegend=False)
        fig = apply_chart_theme(fig)
        st.plotly_chart(fig, use_container_width=True)
    
    # 2. Distribution by % alpha in wallet
    st.markdown("### Distribution by % Alpha in Wallet")
    
    df_cat['alpha_pct_category'] = df_cat['alpha_percentage'].apply(categorize_alpha_percentage)
    
    alpha_pct_order = ['0-25%', '25-50%', '50-95%', '95-100%']
    
    col1, col2 = st.columns(2)
    
    with col1:
        pct_count = df_cat['alpha_pct_category'].value_counts().reindex(alpha_pct_order, fill_value=0)
        fig = px.pie(
            values=pct_count.values,
            names=pct_count.index,
            title='% by Number of Coldkeys',
            hole=0.4,
            color=pct_count.index,
            color_discrete_map=COLOR_PALETTES['alpha_percentage']
        )
        fig.update_traces(textposition='inside', textinfo='percent+label')
        fig.update_layout(showlegend=False)
        fig = apply_chart_theme(fig)
        st.plotly_chart(fig, use_container_width=True)
    
    with col2:
        pct_value = df_cat.groupby('alpha_pct_category')['total_alpha_value_tao'].sum().reindex(alpha_pct_order, fill_value=0)
        fig = px.pie(
            values=pct_value.values,
            names=pct_value.index,
            title='% by TAO Value',
            hole=0.4,
            color=pct_value.index,
            color_discrete_map=COLOR_PALETTES['alpha_percentage']
        )
        fig.update_traces(textposition='inside', textinfo='percent+label')
        fig.update_layout(showlegend=False)
        fig = apply_chart_theme(fig)
        st.plotly_chart(fig, use_container_width=True)
    
    # 3. Distribution by total amount in TAO
    st.markdown("### Distribution by Total Wallet Amount")
    
    df_cat['wallet_value_category'] = df_cat['total_wallet_value_tao'].apply(categorize_wallet_value)
    
    wallet_order = ['< 10 TAO', '10-100 TAO', '100-1K TAO', '1K-10K TAO', '10K+ TAO']
    
    col1, col2 = st.columns(2)
    
    with col1:
        wallet_count = df_cat['wallet_value_category'].value_counts().reindex(wallet_order, fill_value=0)
        fig = px.bar(
            x=wallet_count.index,
            y=wallet_count.values,
            title='Number of Coldkeys by Range',
            labels={'x': 'Range', 'y': 'Number'},
            color=wallet_count.index,
            color_discrete_map=COLOR_PALETTES['wallet_value']
        )
        fig.update_layout(showlegend=False)
        fig = apply_chart_theme(fig)
        st.plotly_chart(fig, use_container_width=True)
    
    with col2:
        wallet_value = df_cat.groupby('wallet_value_category')['total_alpha_value_tao'].sum().reindex(wallet_order, fill_value=0)
        fig = px.bar(
            x=wallet_value.index,
            y=wallet_value.values,
            title='Alpha Value (TAO) by Range',
            labels={'x': 'Range', 'y': 'TAO'},
            color=wallet_value.index,
            color_discrete_map=COLOR_PALETTES['wallet_value']
        )
        fig.update_layout(showlegend=False)
        fig = apply_chart_theme(fig)
        st.plotly_chart(fig, use_container_width=True)
    
    # 4. Distribution by number of transactions
    st.markdown("### Distribution by Number of Transactions")
    
    df_cat['tx_category'] = df_cat['number_tx'].apply(categorize_tx_count)
    
    tx_order = ['0 tx', '1-10 tx', '10-50 tx', '50-100 tx', '100+ tx']
    
    col1, col2 = st.columns(2)
    
    with col1:
        tx_count = df_cat['tx_category'].value_counts().reindex(tx_order, fill_value=0)
        fig = px.bar(
            x=tx_count.index,
            y=tx_count.values,
            title='Number of Coldkeys by Range',
            labels={'x': 'Range', 'y': 'Number'},
            color=tx_count.index,
            color_discrete_map=COLOR_PALETTES['tx_count']
        )
        fig.update_layout(showlegend=False)
        fig = apply_chart_theme(fig)
        st.plotly_chart(fig, use_container_width=True)
    
    with col2:
        tx_value = df_cat.groupby('tx_category')['total_alpha_value_tao'].sum().reindex(tx_order, fill_value=0)
        fig = px.bar(
            x=tx_value.index,
            y=tx_value.values,
            title='Alpha Value (TAO) by Range',
            labels={'x': 'Range', 'y': 'TAO'},
            color=tx_value.index,
            color_discrete_map=COLOR_PALETTES['tx_count']
        )
        fig.update_layout(showlegend=False)
        fig = apply_chart_theme(fig)
        st.plotly_chart(fig, use_container_width=True)

def main():
    # En-tête
    st.markdown('<p class="main-header">Alpha Holders Dashboard</p>', unsafe_allow_html=True)
    
    # Charger les données
    try:
        df = load_data()
    except FileNotFoundError:
        st.error("Data file not found. Please run the analysis first.")
        st.stop()
    
    # Métriques globales
    create_overview_metrics(df)
    
    # Vue d'ensemble par catégorie
    create_category_overview(df)
    
    # Category selector in sidebar
    st.sidebar.markdown("## Filters")
    
    category_filter = st.sidebar.radio(
        "Select a category",
        ['All', 'Subnet Owner', 'Validator', 'Miner', 'Investor'],
        help="Filter analyses by wallet category"
    )
    
    # Display distributions for selected category
    if category_filter == 'All':
        create_distribution_charts(df, 'All', 'Detailed Analysis - All Wallets')
    elif category_filter == 'Subnet Owner':
        create_distribution_charts(df, 'Subnet Owner', 'Detailed Analysis - Subnet Owners')
    elif category_filter == 'Validator':
        create_distribution_charts(df, 'Validator', 'Detailed Analysis - Validators')
    elif category_filter == 'Miner':
        create_distribution_charts(df, 'Miner', 'Detailed Analysis - Miners')
    elif category_filter == 'Investor':
        create_distribution_charts(df, 'Investor', 'Detailed Analysis - Investors')
    
    # Analyse des staking proxies (à la fin)
    create_staking_proxy_analysis(df)
    
    # Footer
    st.markdown("""
    <div style='text-align: center; color: #212278; font-weight: 600;'>
        <p>Bittensor Alpha Holders Analysis | Data Source: Taostats API</p>
    </div>
    """, unsafe_allow_html=True)

if __name__ == "__main__":
    main()
