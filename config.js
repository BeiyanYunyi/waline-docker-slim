import privacy from '@waline-plugins/privacy';
import walinePluginClassItUp from 'waline-plugin-class-it-up';
import pluginUid from 'waline-plugin-uid';

const config = {
  plugins: [walinePluginClassItUp(), privacy, pluginUid],
};

export default config;
