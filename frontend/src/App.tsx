import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppShell />}>
          <Route index element={<div>Dashboard Placeholder</div>} />
          <Route path="reels" element={<div>All Reels Placeholder</div>} />
          <Route path="collections" element={<div>Collections Placeholder</div>} />
          <Route path="watch-later" element={<div>Watch Later Placeholder</div>} />
          <Route path="tags" element={<div>Tags Placeholder</div>} />
          <Route path="settings" element={<div>Settings Placeholder</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
