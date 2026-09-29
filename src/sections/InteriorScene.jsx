import SceneText from "../components/SceneText";

export default function InteriorScene({ scene }) {
  return (
    <div className="absolute inset-0 flex items-center px-6 sm:px-14 md:px-20 lg:px-28">
      <SceneText
        number={scene.number}
        category={scene.category}
        titleLine1={scene.titleLine1}
        titleLine2={scene.titleLine2}
        quote={scene.quote}
        detail={scene.detail}
      />
    </div>
  );
}
