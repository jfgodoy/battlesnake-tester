import { Show, JSX, PropsWithChildren, onCleanup } from "solid-js";
import { Portal } from "solid-js/web";
import { Getter, Setter } from "../solid-utils/index";

export default function Modal(props: PropsWithChildren<{title: string, switch: [Getter<boolean>, Setter<boolean>]}>): JSX.Element {
  const [modal, setModal] = props.switch;
  const closeModal = () => setModal(false);
  const closeOnEsc = (e: KeyboardEvent) => {
    if (e.key == "Escape") {
      closeModal();
    }
  };
  document.addEventListener("keydown", closeOnEsc);

  onCleanup(() => {
    document.removeEventListener("keydown", closeOnEsc);
  });

  return (
    <Show when={modal()}>
      <Portal>
        <div class="absolute inset-0 flex items-center justify-center">
          <div class="bg-black opacity-25 absolute inset-0" onclick={closeModal} />
          <div class="flex flex-col bg-white rounded w-6/12 h-1/4 border shadow text-center z-0">
            <div class="flex flex-row items-center justify-between py-2 px-4 border-b border-gray-200">
              <p class="font-semibold text-gray-800">{props.title}</p>
              <IconBiX onclick={closeModal} class="cursor-pointer" />
            </div>
            {props.children}
          </div>
        </div>
      </Portal>
    </Show>
  );
}
