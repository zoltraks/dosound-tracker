import { AppContainer } from './AppContainer';
import { AppProviders } from './AppProviders';
import { AppInitializer } from './AppInitializer';

const AppRoot = () => {
  return (
    <AppProviders>
      <AppContainer>
        <AppInitializer />
      </AppContainer>
    </AppProviders>
  );
};

export default AppRoot;
