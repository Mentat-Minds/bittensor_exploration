import streamlit as st
import pandas as pd
import json
import plotly.express as px
import plotly.graph_objects as go
from typing import Dict, List

# Page configuration
st.set_page_config(
    page_title="Bittensor Alpha Holders Analysis",
    page_icon="🔷",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for better styling
st.markdown("""
<style>
    .main-header {
        font-size: 3rem;
        font-weight: bold;
        color: #1f77b4;
        text-align: center;
        margin-bottom: 2rem;
    }
    .metric-card {
        background-color: #f0f2f6;
        padding: 1rem;
        border-radius: 0.5rem;
        margin: 0.5rem 0;
    }
    .stMetric {
        background-color: #ffffff;
        padding: 1rem;
        border-radius: 0.5rem;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    /* Number input styling with custom blue color */
    .stNumberInput > div > div > input {
        border-color: #E3F1FF !important;
    }
    .stNumberInput > div > div > input:focus {
        border-color: #282AE6 !important;
        box-shadow: 0 0 0 0.2rem rgba(40, 42, 230, 0.25) !important;
    }
    .stNumberInput button {
        color: #282AE6 !important;
    }
    .stNumberInput button:hover {
        background-color: #E3F1FF !important;
    }
</style>
""", unsafe_allow_html=True)

# Load data
@st.cache_data
def load_data():
    """Load the alpha holders analysis data"""
    with open('output/alpha_holders_analysis.json', 'r') as f:
        data = json.load(f)
    return data

def filter_data_by_role(data: List[Dict], role_filter: str) -> List[Dict]:
    """Filter data by role"""
    if role_filter == "All":
        return data
    
    filtered = []
    for holder in data:
        roles = holder.get('roles', [])
        if role_filter == "Subnet Owner" and "Subnet Owner" in roles:
            filtered.append(holder)
        elif role_filter == "Investor" and "Investor" in roles:
            filtered.append(holder)
        elif role_filter == "Miner" and "Miner" in roles:
            filtered.append(holder)
    
    return filtered

def filter_data_by_staking_proxy(data: List[Dict], proxy_filter: str) -> List[Dict]:
    """Filter data by staking proxy status"""
    if proxy_filter == "All":
        return data
    elif proxy_filter == "True":
        return [h for h in data if h.get('has_staking_proxy', False)]
    else:  # False
        return [h for h in data if not h.get('has_staking_proxy', False)]

def filter_data_by_wallet_value(data: List[Dict], min_value: float, max_value: float) -> List[Dict]:
    """Filter data by total wallet value in TAO"""
    return [h for h in data if min_value <= h.get('total_wallet_value_tao', 0) <= max_value]

def apply_chart_theme(fig):
    """Apply consistent theme to plotly charts"""
    fig.update_layout(
        plot_bgcolor='rgba(0,0,0,0)',
        paper_bgcolor='rgba(0,0,0,0)',
        font=dict(size=12),
        margin=dict(l=20, r=20, t=40, b=20),
        showlegend=True,
        legend=dict(
            orientation="v",
            yanchor="top",
            y=1,
            xanchor="left",
            x=1.02
        )
    )
    return fig

def format_number(num, decimals=2):
    """Format large numbers with K, M, B suffixes"""
    if num >= 1_000_000:
        return f"{num/1_000_000:.{decimals}f}M"
    elif num >= 1_000:
        return f"{num/1_000:.{decimals}f}K"
    else:
        return f"{num:.{decimals}f}"

def create_global_role_analysis(data: List[Dict]):
    """Create global analysis by role (NO FILTERS APPLIED)"""
    st.markdown("<h2>📊 Global Analysis by Role (Unfiltered Data)</h2>", unsafe_allow_html=True)
    
    # Aggregate by role
    role_stats = {}
    
    for holder in data:
        roles = holder.get('roles', ['Unknown'])
        for role in roles:
            if role not in role_stats:
                role_stats[role] = {
                    'count': 0,
                    'total_alpha_tao': 0
                }
            
            role_stats[role]['count'] += 1
            role_stats[role]['total_alpha_tao'] += holder['total_alpha_value_tao']
    
    # Create DataFrame
    role_df = pd.DataFrame([
        {'Role': role, 'Coldkeys': stats['count'], 'Total Alpha (TAO)': stats['total_alpha_tao']}
        for role, stats in role_stats.items()
    ]).sort_values('Total Alpha (TAO)', ascending=False)
    
    col1, col2 = st.columns(2)
    
    with col1:
        # Bar chart: Total TAO by Role
        fig = px.bar(
            role_df,
            x='Role',
            y='Total Alpha (TAO)',
            title='Total Alpha Value (TAO) by Role',
            color='Total Alpha (TAO)',
            color_continuous_scale=[[0, '#E8EAFF'], [0.5, '#868BFF'], [1, '#282AE6']]
        )
        fig.update_traces(hovertemplate='%{x}<br>%{y:.1f} TAO<extra></extra>')
        fig.update_coloraxes(showscale=False)
        fig.update_xaxes(title_text='')
        fig = apply_chart_theme(fig)
        st.plotly_chart(fig, use_container_width=True)
    
    with col2:
        # Bar chart: Number of Coldkeys by Role
        fig = px.bar(
            role_df,
            x='Role',
            y='Coldkeys',
            title='Number of Coldkeys by Role',
            color='Coldkeys',
            color_continuous_scale=[[0, '#E8EAFF'], [0.5, '#868BFF'], [1, '#282AE6']]
        )
        fig.update_traces(hovertemplate='%{x}<br>%{y:.0f} Coldkeys<extra></extra>')
        fig.update_coloraxes(showscale=False)
        fig.update_xaxes(title_text='')
        fig = apply_chart_theme(fig)
        st.plotly_chart(fig, use_container_width=True)

def create_breakdown_by_tx(data: List[Dict]):
    """Create breakdown by number of transactions (10 categories)"""
    st.markdown("<h2>💸 Breakdown by Transaction Count</h2>", unsafe_allow_html=True)
    
    # Define TX categories
    categories = [
        ('0', 0, 0),
        ('1-5', 1, 5),
        ('6-10', 6, 10),
        ('11-20', 11, 20),
        ('21-30', 21, 30),
        ('31-50', 31, 50),
        ('51-75', 51, 75),
        ('76-100', 76, 100),
        ('101-200', 101, 200),
        ('201-500', 201, 500),
        ('500+', 501, float('inf'))
    ]
    
    # Aggregate stats
    tx_stats = []
    for cat_name, min_tx, max_tx in categories:
        holders = [h for h in data if min_tx <= h.get('number_tx', 0) <= max_tx]
        total_alpha = sum(h['total_alpha_value_tao'] for h in holders)
        tx_stats.append({
            'Category': cat_name,
            'Coldkeys': len(holders),
            'Total Alpha (TAO)': total_alpha
        })
    
    df = pd.DataFrame(tx_stats)
    
    col1, col2 = st.columns(2)
    
    with col1:
        # Alpha value by TX category
        fig = px.bar(
            df,
            x='Category',
            y='Total Alpha (TAO)',
            title='Alpha Value by Transaction Count',
            color='Total Alpha (TAO)',
            color_continuous_scale=[[0, '#E8EAFF'], [0.5, '#868BFF'], [1, '#282AE6']]
        )
        fig.update_traces(hovertemplate='%{x}<br>%{y:.1f} TAO<extra></extra>')
        fig.update_coloraxes(showscale=False)
        fig.update_xaxes(title_text='')
        fig = apply_chart_theme(fig)
        st.plotly_chart(fig, use_container_width=True)
    
    with col2:
        # Number of coldkeys by TX category
        fig = px.bar(
            df,
            x='Category',
            y='Coldkeys',
            title='Number of Coldkeys by Transaction Count',
            color='Coldkeys',
            color_continuous_scale=[[0, '#E8EAFF'], [0.5, '#868BFF'], [1, '#282AE6']]
        )
        fig.update_traces(hovertemplate='%{x}<br>%{y:.0f} Coldkeys<extra></extra>')
        fig.update_coloraxes(showscale=False)
        fig.update_xaxes(title_text='')
        fig = apply_chart_theme(fig)
        st.plotly_chart(fig, use_container_width=True)

def create_breakdown_by_tx_time(data: List[Dict]):
    """Create breakdown by number of transaction sessions (tx_time) (10 categories)"""
    st.markdown("<h2>⏰ Breakdown by Transaction Sessions (tx_time)</h2>", unsafe_allow_html=True)
    
    # Define TX sessions categories (same as number_tx)
    categories = [
        ('0', 0, 0),
        ('1-5', 1, 5),
        ('6-10', 6, 10),
        ('11-20', 11, 20),
        ('21-30', 21, 30),
        ('31-50', 31, 50),
        ('51-75', 51, 75),
        ('76-100', 76, 100),
        ('101-200', 101, 200),
        ('201-500', 201, 500),
        ('500+', 501, float('inf'))
    ]
    
    # Aggregate stats
    tx_time_stats = []
    for cat_name, min_sessions, max_sessions in categories:
        holders = [h for h in data if min_sessions <= h.get('tx_time', 0) <= max_sessions]
        total_alpha = sum(h['total_alpha_value_tao'] for h in holders)
        tx_time_stats.append({
            'Category': cat_name,
            'Coldkeys': len(holders),
            'Total Alpha (TAO)': total_alpha
        })
    
    df = pd.DataFrame(tx_time_stats)
    
    col1, col2 = st.columns(2)
    
    with col1:
        # Alpha value by TX sessions category
        fig = px.bar(
            df,
            x='Category',
            y='Total Alpha (TAO)',
            title='Alpha Value by Transaction Sessions Count',
            color='Total Alpha (TAO)',
            color_continuous_scale=[[0, '#E8EAFF'], [0.5, '#868BFF'], [1, '#282AE6']]
        )
        fig.update_traces(hovertemplate='%{x}<br>%{y:.1f} TAO<extra></extra>')
        fig.update_coloraxes(showscale=False)
        fig.update_xaxes(title_text='')
        fig = apply_chart_theme(fig)
        st.plotly_chart(fig, use_container_width=True)
    
    with col2:
        # Number of coldkeys by TX sessions category
        fig = px.bar(
            df,
            x='Category',
            y='Coldkeys',
            title='Number of Coldkeys by Transaction Sessions Count',
            color='Coldkeys',
            color_continuous_scale=[[0, '#E8EAFF'], [0.5, '#868BFF'], [1, '#282AE6']]
        )
        fig.update_traces(hovertemplate='%{x}<br>%{y:.0f} Coldkeys<extra></extra>')
        fig.update_coloraxes(showscale=False)
        fig.update_xaxes(title_text='')
        fig = apply_chart_theme(fig)
        st.plotly_chart(fig, use_container_width=True)

def create_breakdown_by_tx_detailed(data: List[Dict]):
    """Create breakdown by number of transactions (all values with log scale)"""
    st.markdown("<h3>📊 Detailed Transaction Count Distribution</h3>", unsafe_allow_html=True)
    
    # Group by exact transaction count
    tx_stats = {}
    for holder in data:
        tx_count = holder.get('number_tx', 0)
        if tx_count not in tx_stats:
            tx_stats[tx_count] = {
                'holders': [],
                'total_alpha': 0
            }
        tx_stats[tx_count]['holders'].append(holder)
        tx_stats[tx_count]['total_alpha'] += holder['total_alpha_value_tao']
    
    # Convert to DataFrame
    tx_data = []
    for tx_count, stats in sorted(tx_stats.items()):
        tx_data.append({
            'TX Count': tx_count,
            'Coldkeys': len(stats['holders']),
            'Total Alpha (TAO)': stats['total_alpha']
        })
    
    df = pd.DataFrame(tx_data)
    
    col1, col2 = st.columns(2)
    
    with col1:
        # Alpha value by TX count
        fig = px.bar(
            df,
            x='TX Count',
            y='Total Alpha (TAO)',
            title='Alpha Value by Transaction Count (Log Scale)',
            color='Total Alpha (TAO)',
            color_continuous_scale=[[0, '#E8EAFF'], [0.5, '#868BFF'], [1, '#282AE6']],
            log_y=True
        )
        fig.update_traces(hovertemplate='TX: %{x}<br>%{y:.1f} TAO<extra></extra>')
        fig.update_coloraxes(showscale=False)
        fig.update_xaxes(title_text='')
        fig = apply_chart_theme(fig)
        st.plotly_chart(fig, use_container_width=True)
    
    with col2:
        # Number of coldkeys by TX count
        fig = px.bar(
            df,
            x='TX Count',
            y='Coldkeys',
            title='Number of Coldkeys by Transaction Count (Log Scale)',
            color='Coldkeys',
            color_continuous_scale=[[0, '#E8EAFF'], [0.5, '#868BFF'], [1, '#282AE6']],
            log_y=True
        )
        fig.update_traces(hovertemplate='TX: %{x}<br>%{y:.0f} Coldkeys<extra></extra>')
        fig.update_coloraxes(showscale=False)
        fig.update_xaxes(title_text='')
        fig = apply_chart_theme(fig)
        st.plotly_chart(fig, use_container_width=True)

def create_breakdown_by_tx_time_detailed(data: List[Dict]):
    """Create breakdown by number of transaction sessions (tx_time) (all values with log scale)"""
    st.markdown("<h3>⏰ Detailed Transaction Sessions Distribution</h3>", unsafe_allow_html=True)
    
    # Group by exact transaction sessions count
    tx_time_stats = {}
    for holder in data:
        tx_time_count = holder.get('tx_time', 0)
        if tx_time_count not in tx_time_stats:
            tx_time_stats[tx_time_count] = {
                'holders': [],
                'total_alpha': 0
            }
        tx_time_stats[tx_time_count]['holders'].append(holder)
        tx_time_stats[tx_time_count]['total_alpha'] += holder['total_alpha_value_tao']
    
    # Convert to DataFrame
    tx_time_data = []
    for tx_time_count, stats in sorted(tx_time_stats.items()):
        tx_time_data.append({
            'Sessions Count': tx_time_count,
            'Coldkeys': len(stats['holders']),
            'Total Alpha (TAO)': stats['total_alpha']
        })
    
    df = pd.DataFrame(tx_time_data)
    
    col1, col2 = st.columns(2)
    
    with col1:
        # Alpha value by TX sessions count
        fig = px.bar(
            df,
            x='Sessions Count',
            y='Total Alpha (TAO)',
            title='Alpha Value by Transaction Sessions Count (Log Scale)',
            color='Total Alpha (TAO)',
            color_continuous_scale=[[0, '#E8EAFF'], [0.5, '#868BFF'], [1, '#282AE6']],
            log_y=True
        )
        fig.update_traces(hovertemplate='Sessions: %{x}<br>%{y:.1f} TAO<extra></extra>')
        fig.update_coloraxes(showscale=False)
        fig.update_xaxes(title_text='')
        fig = apply_chart_theme(fig)
        st.plotly_chart(fig, use_container_width=True)
    
    with col2:
        # Number of coldkeys by TX sessions count
        fig = px.bar(
            df,
            x='Sessions Count',
            y='Coldkeys',
            title='Number of Coldkeys by Transaction Sessions Count (Log Scale)',
            color='Coldkeys',
            color_continuous_scale=[[0, '#E8EAFF'], [0.5, '#868BFF'], [1, '#282AE6']],
            log_y=True
        )
        fig.update_traces(hovertemplate='Sessions: %{x}<br>%{y:.0f} Coldkeys<extra></extra>')
        fig.update_coloraxes(showscale=False)
        fig.update_xaxes(title_text='')
        fig = apply_chart_theme(fig)
        st.plotly_chart(fig, use_container_width=True)

def create_breakdown_by_tokens(data: List[Dict]):
    """Create breakdown by number of unique tokens held (10 categories)"""
    st.markdown("<h2>🎯 Breakdown by Number of Tokens Held</h2>", unsafe_allow_html=True)
    
    # Define 10 token categories
    categories = [
        ('1', 1, 1),
        ('2-3', 2, 3),
        ('4-5', 4, 5),
        ('6-8', 6, 8),
        ('9-12', 9, 12),
        ('13-16', 13, 16),
        ('17-20', 17, 20),
        ('21-30', 21, 30),
        ('31-50', 31, 50),
        ('50+', 51, float('inf'))
    ]
    
    # Aggregate stats
    token_stats = []
    for cat_name, min_tokens, max_tokens in categories:
        holders = [h for h in data if min_tokens <= h.get('unique_alpha_tokens', 0) <= max_tokens]
        total_alpha = sum(h['total_alpha_value_tao'] for h in holders)
        token_stats.append({
            'Category': cat_name,
            'Coldkeys': len(holders),
            'Total Alpha (TAO)': total_alpha
        })
    
    df = pd.DataFrame(token_stats)
    
    col1, col2 = st.columns(2)
    
    with col1:
        # Alpha value by token category
        fig = px.bar(
            df,
            x='Category',
            y='Total Alpha (TAO)',
            title='Alpha Value by Number of Tokens',
            color='Total Alpha (TAO)',
            color_continuous_scale=[[0, '#E8EAFF'], [0.5, '#868BFF'], [1, '#282AE6']]
        )
        fig.update_traces(hovertemplate='%{x}<br>%{y:.1f} TAO<extra></extra>')
        fig.update_coloraxes(showscale=False)
        fig.update_xaxes(title_text='')
        fig = apply_chart_theme(fig)
        st.plotly_chart(fig, use_container_width=True)
    
    with col2:
        # Number of coldkeys by token category
        fig = px.bar(
            df,
            x='Category',
            y='Coldkeys',
            title='Number of Coldkeys by Token Count',
            color='Coldkeys',
            color_continuous_scale=[[0, '#E8EAFF'], [0.5, '#868BFF'], [1, '#282AE6']]
        )
        fig.update_traces(hovertemplate='%{x}<br>%{y:.0f} Coldkeys<extra></extra>')
        fig.update_coloraxes(showscale=False)
        fig.update_xaxes(title_text='')
        fig = apply_chart_theme(fig)
        st.plotly_chart(fig, use_container_width=True)

def create_breakdown_by_tokens_detailed(data: List[Dict]):
    """Create breakdown by number of unique tokens held (all values with log scale)"""
    st.markdown("<h3>📊 Detailed Token Count Distribution</h3>", unsafe_allow_html=True)
    
    # Group by exact token count
    token_stats = {}
    for holder in data:
        token_count = holder.get('unique_alpha_tokens', 0)
        if token_count not in token_stats:
            token_stats[token_count] = {
                'holders': [],
                'total_alpha': 0
            }
        token_stats[token_count]['holders'].append(holder)
        token_stats[token_count]['total_alpha'] += holder['total_alpha_value_tao']
    
    # Convert to DataFrame
    token_data = []
    for token_count, stats in sorted(token_stats.items()):
        token_data.append({
            'Token Count': token_count,
            'Coldkeys': len(stats['holders']),
            'Total Alpha (TAO)': stats['total_alpha']
        })
    
    df = pd.DataFrame(token_data)
    
    col1, col2 = st.columns(2)
    
    with col1:
        # Alpha value by token count
        fig = px.bar(
            df,
            x='Token Count',
            y='Total Alpha (TAO)',
            title='Alpha Value by Number of Tokens (Log Scale)',
            color='Total Alpha (TAO)',
            color_continuous_scale=[[0, '#E8EAFF'], [0.5, '#868BFF'], [1, '#282AE6']],
            log_y=True
        )
        fig.update_traces(hovertemplate='Tokens: %{x}<br>%{y:.1f} TAO<extra></extra>')
        fig.update_coloraxes(showscale=False)
        fig.update_xaxes(title_text='')
        fig = apply_chart_theme(fig)
        st.plotly_chart(fig, use_container_width=True)
    
    with col2:
        # Number of coldkeys by token count
        fig = px.bar(
            df,
            x='Token Count',
            y='Coldkeys',
            title='Number of Coldkeys by Token Count (Log Scale)',
            color='Coldkeys',
            color_continuous_scale=[[0, '#E8EAFF'], [0.5, '#868BFF'], [1, '#282AE6']],
            log_y=True
        )
        fig.update_traces(hovertemplate='Tokens: %{x}<br>%{y:.0f} Coldkeys<extra></extra>')
        fig.update_coloraxes(showscale=False)
        fig.update_xaxes(title_text='')
        fig = apply_chart_theme(fig)
        st.plotly_chart(fig, use_container_width=True)

def create_breakdown_by_alpha_percentage(data: List[Dict]):
    """Create breakdown by alpha percentage"""
    st.markdown("<h2>📈 Breakdown by Alpha Percentage</h2>", unsafe_allow_html=True)
    
    # Define alpha % categories
    categories = [
        ('0-25%', lambda h: h.get('alpha_percentage', 0) < 25),
        ('25-50%', lambda h: 25 <= h.get('alpha_percentage', 0) < 50),
        ('50-75%', lambda h: 50 <= h.get('alpha_percentage', 0) < 75),
        ('75-90%', lambda h: 75 <= h.get('alpha_percentage', 0) < 90),
        ('90-95%', lambda h: 90 <= h.get('alpha_percentage', 0) < 95),
        ('95-99%', lambda h: 95 <= h.get('alpha_percentage', 0) < 99),
        ('99-100%', lambda h: h.get('alpha_percentage', 0) >= 99)
    ]
    
    # Aggregate stats
    alpha_stats = []
    for cat_name, cat_filter in categories:
        holders = [h for h in data if cat_filter(h)]
        total_alpha = sum(h['total_alpha_value_tao'] for h in holders)
        alpha_stats.append({
            'Category': cat_name,
            'Coldkeys': len(holders),
            'Total Alpha (TAO)': total_alpha
        })
    
    df = pd.DataFrame(alpha_stats)
    
    col1, col2 = st.columns(2)
    
    with col1:
        # Alpha value by alpha %
        fig = px.bar(
            df,
            x='Category',
            y='Total Alpha (TAO)',
            title='Alpha Value by Alpha Percentage Range',
            color='Total Alpha (TAO)',
            color_continuous_scale=[[0, '#E8EAFF'], [0.5, '#868BFF'], [1, '#282AE6']]
        )
        fig.update_traces(hovertemplate='%{x}<br>%{y:.1f} TAO<extra></extra>')
        fig.update_coloraxes(showscale=False)
        fig.update_xaxes(title_text='')
        fig = apply_chart_theme(fig)
        st.plotly_chart(fig, use_container_width=True)
    
    with col2:
        # Number of coldkeys by alpha %
        fig = px.bar(
            df,
            x='Category',
            y='Coldkeys',
            title='Number of Coldkeys by Alpha Percentage',
            color='Coldkeys',
            color_continuous_scale=[[0, '#E8EAFF'], [0.5, '#868BFF'], [1, '#282AE6']]
        )
        fig.update_traces(hovertemplate='%{x}<br>%{y:.0f} Coldkeys<extra></extra>')
        fig.update_coloraxes(showscale=False)
        fig.update_xaxes(title_text='')
        fig = apply_chart_theme(fig)
        st.plotly_chart(fig, use_container_width=True)

def create_top_holders_table(data: List[Dict], n: int = 20):
    """Create table of top holders"""
    st.markdown(f"<h2>🏆 Top {n} Alpha Holders</h2>", unsafe_allow_html=True)
    
    # Sort by total alpha value
    sorted_data = sorted(data, key=lambda x: x['total_alpha_value_tao'], reverse=True)[:n]
    
    # Create dataframe
    table_data = []
    for i, holder in enumerate(sorted_data, 1):
        table_data.append({
            "Rank": i,
            "Coldkey": holder['coldkey'][:20] + "...",
            "Alpha Value (TAO)": f"{holder['total_alpha_value_tao']:,.2f}",
            "Total Value (TAO)": f"{holder['total_wallet_value_tao']:,.2f}",
            "Alpha %": f"{holder['alpha_percentage']:.2f}%",
            "Unique Tokens": holder['unique_alpha_tokens'],
            "Staking Proxy": "✅" if holder.get('has_staking_proxy', False) else "❌",
            "Roles": ", ".join(holder.get('roles', []))
        })
    
    df = pd.DataFrame(table_data)
    st.dataframe(df, use_container_width=True, hide_index=True)

def create_subnet_breakdown(data: List[Dict]):
    """Create subnet-level breakdown of alpha stakes"""
    st.markdown("<h2>🌐 Complete Subnet Breakdown</h2>", unsafe_allow_html=True)
    
    # Aggregate alpha holdings by subnet
    subnet_stats = {}
    
    for holder in data:
        for holding in holder.get('alpha_holdings', []):
            netuid = holding['netuid']
            subnet_name = holding['subnet_name']
            balance_alpha = holding['balance_alpha']
            value_tao = holding['value_tao']
            
            if netuid not in subnet_stats:
                subnet_stats[netuid] = {
                    'netuid': netuid,
                    'subnet_name': subnet_name,
                    'total_alpha_staked': 0,
                    'total_value_tao': 0,
                    'staker_count': set()
                }
            
            subnet_stats[netuid]['total_alpha_staked'] += balance_alpha
            subnet_stats[netuid]['total_value_tao'] += value_tao
            subnet_stats[netuid]['staker_count'].add(holder['coldkey'])
    
    # Convert to DataFrame
    subnet_data = []
    for netuid, stats in subnet_stats.items():
        subnet_data.append({
            'Netuid': netuid,
            'Subnet Name': stats['subnet_name'],
            'Total Alpha Staked': stats['total_alpha_staked'],
            'Total Value (TAO)': stats['total_value_tao'],
            'Number of Stakers': len(stats['staker_count'])
        })
    
    subnet_df = pd.DataFrame(subnet_data).sort_values('Total Value (TAO)', ascending=False)
    
    # Create horizontal bar chart with dynamic height
    num_subnets = len(subnet_df)
    chart_height = max(600, num_subnets * 20)  # Minimum 600px, 20px per subnet
    
    fig = go.Figure()
    
    fig.add_trace(go.Bar(
        y=subnet_df['Subnet Name'],
        x=subnet_df['Total Value (TAO)'],
        orientation='h',
        text=subnet_df['Total Value (TAO)'].apply(lambda x: f"{x:,.0f} TAO"),
        textposition='auto',
        marker=dict(
            color=subnet_df['Total Value (TAO)'],
            colorscale=[[0, '#E8EAFF'], [0.5, '#868BFF'], [1, '#282AE6']],
            showscale=False
        ),
        hovertemplate='<b>%{y}</b><br>Total Value: %{x:,.2f} TAO<br>Stakers: %{customdata}<extra></extra>',
        customdata=subnet_df['Number of Stakers']
    ))
    
    fig.update_layout(
        title=f'Alpha Value Distribution Across All Subnets ({len(subnet_df)} subnets)',
        xaxis_title='Total Alpha Value (TAO)',
        yaxis_title='Subnet',
        height=chart_height,
        showlegend=False,
        yaxis=dict(autorange="reversed"),
        plot_bgcolor='rgba(0,0,0,0)',
        paper_bgcolor='rgba(0,0,0,0)'
    )
    
    fig = apply_chart_theme(fig)
    st.plotly_chart(fig, use_container_width=True)
    
    # Display detailed table
    st.markdown("### 📋 Detailed Subnet Data")
    
    display_df = subnet_df.copy()
    display_df['Total Alpha Staked'] = display_df['Total Alpha Staked'].apply(lambda x: f"{x:,.2f}")
    display_df['Total Value (TAO)'] = display_df['Total Value (TAO)'].apply(lambda x: f"{x:,.2f}")
    display_df['Number of Stakers'] = display_df['Number of Stakers'].apply(lambda x: f"{x:,}")
    
    st.dataframe(display_df, use_container_width=True, hide_index=True, height=600)

def main():
    """Main application"""
    st.markdown("<h1 class='main-header'>🔷 Bittensor Alpha Holders Analysis</h1>", unsafe_allow_html=True)
    
    # Load data
    try:
        data = load_data()
        st.success(f"✅ Loaded {len(data):,} alpha holders")
    except Exception as e:
        st.error(f"❌ Error loading data: {str(e)}")
        st.stop()
    
    # ============ GLOBAL FILTERS (Sidebar) ============
    st.sidebar.header("🔍 Global Filters")
    
    # Filter by role
    role_filter = st.sidebar.selectbox(
        "Filter by Role",
        options=["All", "Subnet Owner", "Investor", "Miner"],
        index=0
    )
    
    # Filter by staking proxy
    proxy_filter = st.sidebar.selectbox(
        "Filter by Staking Proxy",
        options=["All", "True", "False"],
        index=0
    )
    
    # Filter by wallet value (TAO)
    st.sidebar.divider()
    st.sidebar.markdown("**💰 Filter by Total Wallet Value (TAO)**")
    
    # Get min and max wallet values
    wallet_values = [h.get('total_wallet_value_tao', 0) for h in data]
    min_wallet_value = min(wallet_values)
    max_wallet_value = max(wallet_values)
    
    # Number inputs for wallet value range
    col1, col2 = st.sidebar.columns(2)
    with col1:
        min_value_input = st.number_input(
            "Min (TAO)",
            min_value=float(min_wallet_value),
            max_value=float(max_wallet_value),
            value=float(min_wallet_value),
            step=1.0,
            format="%.0f"
        )
    with col2:
        max_value_input = st.number_input(
            "Max (TAO)",
            min_value=float(min_wallet_value),
            max_value=float(max_wallet_value),
            value=float(max_wallet_value),
            step=1.0,
            format="%.0f"
        )
    
    value_range = (min_value_input, max_value_input)
    
    st.sidebar.divider()
    st.sidebar.info("Filters apply to all sections EXCEPT 'Global Analysis by Role'")
    
    # ============ SECTION 1: GLOBAL ANALYSIS (NO FILTERS) ============
    st.markdown("---")
    st.markdown("## 📍 Section 1: Global Overview (Unfiltered)")
    st.info("⚠️ This section shows ALL data without any filters applied")
    
    create_global_role_analysis(data)
    
    # ============ APPLY FILTERS FOR ALL FOLLOWING SECTIONS ============
    st.markdown("---")
    st.markdown("## 📍 Section 2+: Filtered Analysis")
    st.warning(f"🔍 Filters Active: Role = {role_filter} | Staking Proxy = {proxy_filter} | Wallet Value = {value_range[0]:.0f}-{value_range[1]:.0f} TAO")
    
    # Apply role filter
    filtered_data = filter_data_by_role(data, role_filter)
    
    # Apply staking proxy filter
    filtered_data = filter_data_by_staking_proxy(filtered_data, proxy_filter)
    
    # Apply wallet value filter
    filtered_data = filter_data_by_wallet_value(filtered_data, value_range[0], value_range[1])
    
    st.info(f"Showing {len(filtered_data):,} / {len(data):,} holders after filtering")
    
    # Display filtered data metrics
    col1, col2, col3 = st.columns(3)
    
    # Calculate metrics
    total_alpha_value = sum(h.get('total_alpha_value_tao', 0) for h in filtered_data)
    num_proxy_set = sum(1 for h in filtered_data if h.get('has_staking_proxy', False))
    
    with col1:
        st.metric(
            label="💎 Total Alpha Value",
            value=f"{total_alpha_value:,.1f} TAO"
        )
    
    with col2:
        st.metric(
            label="👥 Number of Addresses",
            value=f"{len(filtered_data):,}"
        )
    
    with col3:
        st.metric(
            label="🔒 Proxy Set",
            value=f"{num_proxy_set:,}"
        )
    
    st.divider()
    
    # ============ SECTION 2: BREAKDOWN BY TRANSACTION COUNT ============
    create_breakdown_by_tx(filtered_data)
    
    # ============ SECTION 2b: BREAKDOWN BY TRANSACTION SESSIONS (tx_time) ============
    st.divider()
    create_breakdown_by_tx_time(filtered_data)
    
    # ============ SECTION 3: BREAKDOWN BY NUMBER OF TOKENS ============
    st.divider()
    create_breakdown_by_tokens(filtered_data)
    
    # ============ SECTION 4: BREAKDOWN BY ALPHA PERCENTAGE ============
    st.divider()
    create_breakdown_by_alpha_percentage(filtered_data)
    
    # ============ ADDITIONAL: TOP HOLDERS TABLE ============
    st.divider()
    create_top_holders_table(filtered_data, n=20)
    
    # ============ SECTION 5: COMPLETE SUBNET BREAKDOWN ============
    st.divider()
    create_subnet_breakdown(filtered_data)
    
    # ============ ANNEXE: DETAILED DISTRIBUTIONS ============
    st.markdown("---")
    st.markdown("## 📑 Annexe: Detailed Distributions (Log Scale)")
    st.info("ℹ️ These charts show the complete distribution with logarithmic scale for better visibility of all values")
    
    with st.expander("🔍 View Detailed Transaction & Token Distributions", expanded=False):
        create_breakdown_by_tx_detailed(filtered_data)
        st.divider()
        create_breakdown_by_tx_time_detailed(filtered_data)
        st.divider()
        create_breakdown_by_tokens_detailed(filtered_data)
    
    # Footer
    st.markdown("---")
    st.markdown(
        "<p style='text-align: center; color: gray;'>Bittensor Alpha Holders Analysis Dashboard | "
        f"Data contains {len(data):,} unique coldkeys</p>",
        unsafe_allow_html=True
    )

if __name__ == "__main__":
    main()
