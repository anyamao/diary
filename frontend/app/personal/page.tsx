import Loading from "@/components/Loading";

function page() {
  return (
    <div className=" w-full h-full min-h-[950px] flex flex-row items-start justify-center pt-[120px] bg-pink-100 ">
      <div className="flex flex-col items-center">
        <h2 className="text-2xl text-pink-900 font-bold">
          Страница в разработке, пользуйся навигацией сверху
        </h2>
        <img src="/diary_armsup.png" className="w-[300px]" />
      </div>
    </div>
  );
}

export default page;
