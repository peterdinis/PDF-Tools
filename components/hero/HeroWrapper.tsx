import { FC } from "react";
import Navigation from "../shared/Navigation";

const HeroWrapper: FC = () => {
    return (
        <div className="min-h-screen">
            <Navigation />
            <section className="border-b bg-gradient-to-b from-background to-secondary/20 py-16">
                <div className="container mx-auto px-4 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 text-balance">
                        Every tool you need to work with PDFs in one place
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-3xl mx-auto text-pretty">
                        Every tool you need to use PDFs, at your fingertips. All are 100% FREE and easy to use! Merge, split,
                        compress, convert, rotate, unlock and watermark PDFs with just a few clicks.
                    </p>
                </div>
            </section>
        </div>
    )
}

export default HeroWrapper;