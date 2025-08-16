import Link from "next/link";
import Button from "../button";

export default function SimpleNav({
  handleClose,
}: {
  handleClose: () => void;
}) {
  return (
    <nav className={`mb-6 flex w-full items-center justify-between rounded-lg`}>
      <Link href={"/dashboard"} onClick={handleClose}>
        <Button variant="ghost">
          Dashboard
        </Button>
      </Link>
      <Link href={"/create-prediction"} onClick={handleClose}>
        <Button variant="ghost">
          Create +
        </Button>
      </Link>
    </nav>
  );
}
