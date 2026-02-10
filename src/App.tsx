import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import MergeTool from './tools/MergeTool';
import SplitTool from './tools/SplitTool';
import CompressTool from './tools/CompressTool';
import RotateTool from './tools/RotateTool';
import ImagesToPdfTool from './tools/ImagesToPdfTool';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/merge" element={<MergeTool />} />
          <Route path="/split" element={<SplitTool />} />
          <Route path="/compress" element={<CompressTool />} />
          <Route path="/rotate" element={<RotateTool />} />
          <Route path="/images-to-pdf" element={<ImagesToPdfTool />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
