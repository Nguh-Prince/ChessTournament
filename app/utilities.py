def is_power_of_2(number):
    if number == 1:
        return True

    if number % 2 == 1:
        return False

    return is_power_of_2(number / 2)
