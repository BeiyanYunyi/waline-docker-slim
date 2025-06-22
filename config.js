import privacy from '@waline-plugins/privacy';
import pluginUid from 'waline-plugin-uid';

const apiAddress = process.env.CLASS_IT_UP_API;

const config = {
  preSave: async (comment) => {
    if (apiAddress) {
      /** @type {{ predicted_label: 0 | 1 }} */
      const res = await fetch(apiAddress, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: comment.comment }),
      }).then((res) => res.json());
      if (res.predicted_label === 1) {
        think.logger.warn('Stalking detected');
        comment.status = 'waiting';
        throw new Error(
          'Stalking-like comment detected, please rearrange your comment.',
        );
      }
    }
  },

  plugins: [privacy, pluginUid],
};

export default config;
