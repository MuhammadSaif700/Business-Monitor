def greet_user():
    def main():
        name = input("What is your name? ")
        print(f"Hello, {name}!")

    if __name__ == "__main__":
        main()

greet_user()