import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

import { Button } from "../components/ui/button";
import { FileUploadDemo } from "../components/FileUpload";

import React from "react";

export default function DrawerOpen({ name = "", title = "", desc = "" }) {
  return (
    <div>
      <Drawer>
        <div>
          <DrawerTrigger className="group/btn  relative block h-8 w-40 rounded-md bg-gradient-to-br from-black to-neutral-600 font-medium text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:bg-zinc-800 dark:from-zinc-900 dark:to-zinc-900 dark:shadow-[0px_1px_0px_0px_#27272a_inset,0px_-1px_0px_0px_#27272a_inset]">
            {`${name}`}
          </DrawerTrigger>
        </div>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="text-center">{`${title}`}</DrawerTitle>
            <DrawerDescription className="text-center">{`${desc}`}</DrawerDescription>
          </DrawerHeader>
          <FileUploadDemo />
          {/* <DrawerFooter>
            <Button>Submit</Button>
            <DrawerClose>
              <Button variant="outline">Cancel</Button>
            </DrawerClose>
          </DrawerFooter> */}
        </DrawerContent>
      </Drawer>
    </div>
  );
}
