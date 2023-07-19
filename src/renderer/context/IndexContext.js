import {
  useState,
  createContext,
  useContext,
  useEffect,
  useCallback,
} from 'react';
import { useLocation } from 'react-router-dom';
import { usePilesContext } from './PilesContext';

export const IndexContext = createContext();

export const IndexContextProvider = ({ children }) => {
  const { currentPile, getCurrentPilePath } = usePilesContext();
  const [index, setIndex] = useState(new Map());

  useEffect(() => {
    if (currentPile) {
      loadIndex(getCurrentPilePath());
    }
  }, [currentPile]);

  const loadIndex = useCallback(async (pilePath) => {
    const newIndex = await window.electron.ipc.invoke('index-load', pilePath);
    const newMap = new Map(newIndex);
    setIndex(newMap);
    console.log('Index loaded.');
  }, []);

  const refreshIndex = useCallback(async () => {
    const newIndex = await window.electron.ipc.invoke('index-get');
    const newMap = new Map(newIndex);
    setIndex(newMap);
  }, []);

  const addIndex = useCallback(async (filePath) => {
    window.electron.ipc.invoke('index-add', filePath).then((index) => {
      setIndex(index);
    });
  }, []);

  const removeIndex = useCallback(async (filePath) => {
    window.electron.ipc.invoke('index-remove', pilePath).then((index) => {
      setIndex(index);
    });
  }, []);

  const indexContextValue = { index, refreshIndex, addIndex, removeIndex };

  return (
    <IndexContext.Provider value={indexContextValue}>
      {children}
    </IndexContext.Provider>
  );
};

export const useIndexContext = () => useContext(IndexContext);