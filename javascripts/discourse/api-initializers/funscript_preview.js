import { apiInitializer } from "discourse/lib/api";
import { withPluginApi } from "discourse/lib/plugin-api";
import { iconHTML } from "discourse-common/lib/icon-library";
import { renderHeatmap, getSpeed } from "../lib/script_utils";

export const HEIGHT = settings.preview_height;
export const WIDTH = settings.preview_width;


export var elements = [];
export var scripts = [];

export default apiInitializer("0.11.1", api => {

  async function get_funscript(url="") {
    const response = await fetch(url);
    return response.json()
  }

  const createPreviewElement = () => {
    const canvas = document.createElement("canvas");
    canvas.height = HEIGHT;
    canvas.width = WIDTH;
    canvas.classList.add("script-preview");

    return canvas;
  };

  const create_stats = () => {
    const stats = document.createElement("div");
    stats.style.width = `${WIDTH}px`;
    stats.style.textAlign = "center";
    stats.classList.add("script-stats");
    return stats
  }

  const setup_stats = (duration, average_speed, actions, preview) => {
      const stats = create_stats();
      stats.innerText = `Duration: ${duration} | Average Speed: ${average_speed} | Actions: ${actions}`;
      preview.after(stats);
      return stats;
  }

  const setUpPreviewType = (script) => {
    const preview = createPreviewElement();
    script.after(preview);

    return preview;

  };

  api.decorateCookedElement(
    (post) => {
      elements.forEach((element) => {
        element.remove();
      });
      elements = [];
      const attachments = [...post.querySelectorAll(".attachment")];
      const funscripts = attachments.filter((attachment) =>
      /\.funscript$/i.test(attachment.href)
      );


      funscripts.forEach(async (script) => {
          const url = script.href;

          scripts.push(url);

          const preview = setUpPreviewType(script.parentElement);
          elements.push(preview);
          var ctx = preview.getContext("2d");
          ctx.fillRect(0,0,WIDTH,HEIGHT);
          const placeholder = setup_stats("0000","000","0000",preview);

          const data = await get_funscript(url);
          renderHeatmap(preview,data);
          const action = data.actions.length;
          const duration = data.actions[data.actions.length - 1].at;
          const time = new Date(duration).toISOString().slice(11, -5);

          const averageSpeed = data.actions.reduce((acc, action, index) => {
            if(index === 0) return acc;
            const speed = getSpeed(data.actions[index - 1], data.actions[index]);
            return acc + speed;
          }, 0) / (data.actions.length - 1);

          placeholder.remove();
          const stats = setup_stats(time,Math.round(averageSpeed),action,preview);
          elements.push(stats);
      });
    }
  );
});
