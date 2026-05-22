// 重定向到静态演示页面
import { redirect } from "next/navigation";

export default function DemoTraining() {
  redirect("/demo/training-static");
}
