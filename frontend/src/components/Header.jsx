function Header() {
    return (
        <header className="app-header">
            <div className="brand">
                <div className="brand-icon">🌊</div>

                <div>
                    <h1>OCEAN-X</h1>
                    <span>Interactive Ocean Data Explorer</span>
                </div>
            </div>

            <div className="header-status">
                <span className="status-dot"></span>
                SYSTEM ONLINE
            </div>
        </header>
    );
}

export default Header;